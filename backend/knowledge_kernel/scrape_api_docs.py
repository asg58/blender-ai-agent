import requests
import json
from bs4 import BeautifulSoup
import os
from urllib.parse import urljoin

def scrape_page(url):
    """Scrape a single page from the Blender API docs"""
    print(f"Scraping: {url}")
    response = requests.get(url)
    soup = BeautifulSoup(response.text, 'html.parser')
    
    main_div = soup.find('div', {'role': 'main'})
    if not main_div:
        return None
    
    title = soup.find('title').text.strip() if soup.find('title') else "Unknown"
    content = main_div.get_text(separator=' ', strip=True)
    
    return {
        "title": title,
        "content": content,
        "url": url
    }

def get_links(url):
    """Get all links from a page"""
    response = requests.get(url)
    soup = BeautifulSoup(response.text, 'html.parser')
    links = []
    
    for a_tag in soup.find_all('a'):
        href = a_tag.get('href')
        if href and href.startswith(('bpy.', 'bmesh.')):
            full_url = urljoin(url, href)
            links.append(full_url)
    
    return links

def main():
    base_url = "https://docs.blender.org/api/current/bpy.ops.html"
    output_file = "blender_api_scraped.json"
    
    # Create directory if it doesn't exist
    os.makedirs(os.path.dirname(os.path.abspath(output_file)), exist_ok=True)
    
    # First get all links from the main page
    all_links = get_links(base_url)
    print(f"Found {len(all_links)} links to scrape")
    
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
    
    print(f"Scraping complete. Saved {len(results)} pages to {output_file}")

if __name__ == "__main__":
    main() 