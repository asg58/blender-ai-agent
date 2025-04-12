import requests
import json
from bs4 import BeautifulSoup
import os
import logging
from urllib.parse import urljoin
from typing import Dict, List, Optional
from datetime import datetime

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def scrape_page(url: str) -> Optional[Dict[str, str]]:
    """
    Scrape a single page from the Blender API docs
    
    Args:
        url (str): URL to scrape
        
    Returns:
        Optional[Dict[str, str]]: Document data or None if failed
    """
    logger.info(f"Scraping: {url}")
    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()  # Raise exception for bad status codes
        
        soup = BeautifulSoup(response.text, 'html.parser')
        
        main_div = soup.find('div', {'role': 'main'})
        if not main_div:
            logger.warning(f"No main content found at {url}")
            return None
        
        title_element = soup.find('title')
        title = title_element.text.strip() if title_element else "Unknown"
        content = main_div.get_text(separator=' ', strip=True)
        
        return {
            "title": title,
            "content": content,
            "url": url,
            "scraped_at": datetime.now().isoformat()
        }
    except requests.RequestException as e:
        logger.error(f"Error scraping {url}: {e}")
        return None

def get_links(url: str) -> List[str]:
    """
    Get all links from a page
    
    Args:
        url (str): URL to get links from
        
    Returns:
        List[str]: List of found links
    """
    links = []
    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.text, 'html.parser')
        
        for a_tag in soup.find_all('a'):
            href = a_tag.get('href')
            if href and href.startswith(('bpy.', 'bmesh.')):
                full_url = urljoin(url, href)
                links.append(full_url)
        
        return links
    except requests.RequestException as e:
        logger.error(f"Error getting links from {url}: {e}")
        return []

def main() -> None:
    """Main function to scrape Blender API documentation"""
    base_url = "https://docs.blender.org/api/current/bpy.ops.html"
    output_file = "blender_api_scraped.json"
    
    # Create directory if it doesn't exist
    os.makedirs(os.path.dirname(os.path.abspath(output_file)) or ".", exist_ok=True)
    
    # First get all links from the main page
    all_links = get_links(base_url)
    logger.info(f"Found {len(all_links)} links to scrape")
    
    # Then scrape each page
    results = []
    for link in all_links:
        page_data = scrape_page(link)
        if page_data:
            results.append(page_data)
    
    # Also scrape the main page
    main_page = scrape_page(base_url)
    if main_page:
        results.append(main_page)
    
    # Save to JSON file
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    
    logger.info(f"Scraping complete. Saved {len(results)} pages to {output_file}")

if __name__ == "__main__":
    main() 