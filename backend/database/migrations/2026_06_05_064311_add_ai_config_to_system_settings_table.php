<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        DB::table('system_settings')->insert([
            [
                'key' => 'ai_provider',
                'value' => 'groq',
                'group' => 'ai_config',
                'type' => 'string',
                'label' => 'Active AI Provider',
                'description' => 'The currently active AI provider (e.g., groq, openai).',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'groq_api_key',
                'value' => '',
                'group' => 'ai_config',
                'type' => 'string',
                'label' => 'Groq API Key',
                'description' => 'API Key for accessing Groq services.',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'openai_api_key',
                'value' => '',
                'group' => 'ai_config',
                'type' => 'string',
                'label' => 'OpenAI API Key',
                'description' => 'API Key for accessing OpenAI services.',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'ai_model',
                'value' => 'llama-3.3-70b-versatile',
                'group' => 'ai_config',
                'type' => 'string',
                'label' => 'AI Model Name',
                'description' => 'The specific AI model to use (e.g., llama-3.3-70b-versatile or gpt-4o).',
                'created_at' => now(),
                'updated_at' => now(),
            ]
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::table('system_settings')
            ->whereIn('key', ['ai_provider', 'groq_api_key', 'openai_api_key', 'ai_model'])
            ->delete();
    }
};
