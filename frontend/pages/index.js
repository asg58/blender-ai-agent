import React from 'react';
import Head from 'next/head';
import ConnectionStatus from '../components/ConnectionStatus';
import CommandInput from '../components/CommandInput';
import SceneInfo from '../components/SceneInfo';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <Head>
        <title>Blender AI Agent</title>
        <meta name="description" content="Control Blender with AI" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800 dark:text-white">
          Blender AI Agent
        </h1>
        
        <div className="max-w-6xl mx-auto">
          <div className="mb-4">
            <ConnectionStatus />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Main command area - 2/3 width on medium+ screens */}
            <div className="md:col-span-2">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">
                  Command Interface
                </h2>
                <CommandInput />
              </div>
              
              <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
                <p>
                  Try commands like: "Create a red cube" or "Render the current scene"
                </p>
              </div>
            </div>
            
            {/* Scene info panel - 1/3 width on medium+ screens */}
            <div>
              <SceneInfo />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 