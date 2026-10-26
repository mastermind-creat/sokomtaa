<?php

namespace Database\Seeders;

use App\Models\SearchAlias;
use Illuminate\Database\Seeder;

class SearchAliasSeeder extends Seeder
{
    public function run(): void
    {
        $aliases = [
            // Swahili → English (produce)
            ['alias' => 'nyanya',          'maps_to' => 'tomatoes',           'language' => 'sw'],
            ['alias' => 'vitunguu',        'maps_to' => 'onions',             'language' => 'sw'],
            ['alias' => 'sukuma',          'maps_to' => 'sukuma wiki',        'language' => 'sw'],
            ['alias' => 'maembe',          'maps_to' => 'mangoes',            'language' => 'sw'],
            ['alias' => 'viazi',           'maps_to' => 'potatoes',           'language' => 'sw'],
            ['alias' => 'mchele',          'maps_to' => 'rice',               'language' => 'sw'],
            ['alias' => 'ugali',           'maps_to' => 'unga wa mahindi',    'language' => 'sw'],
            ['alias' => 'samaki',          'maps_to' => 'fish',               'language' => 'sw'],
            ['alias' => 'nyama',           'maps_to' => 'meat',               'language' => 'sw'],
            ['alias' => 'chai',            'maps_to' => 'tea leaves',         'language' => 'sw'],
            ['alias' => 'mkaa',            'maps_to' => 'charcoal',           'language' => 'sw'],
            ['alias' => 'mayai',           'maps_to' => 'eggs',               'language' => 'sw'],
            ['alias' => 'maziwa',          'maps_to' => 'milk',               'language' => 'sw'],
            ['alias' => 'ndizi',           'maps_to' => 'bananas',            'language' => 'sw'],
            ['alias' => 'kabichi',         'maps_to' => 'cabbage',            'language' => 'sw'],
            ['alias' => 'karoti',          'maps_to' => 'carrots',            'language' => 'sw'],
            ['alias' => 'pilipili',        'maps_to' => 'pepper',             'language' => 'sw'],
            ['alias' => 'tangawizi',       'maps_to' => 'ginger',             'language' => 'sw'],
            ['alias' => 'kitunguu saumu', 'maps_to' => 'garlic',             'language' => 'sw'],
            ['alias' => 'nafaka',          'maps_to' => 'grains',             'language' => 'sw'],
            ['alias' => 'dengu',           'maps_to' => 'lentils',            'language' => 'sw'],
            ['alias' => 'maharagwe',       'maps_to' => 'beans',              'language' => 'sw'],
            ['alias' => 'ngano',           'maps_to' => 'wheat flour',        'language' => 'sw'],
            ['alias' => 'mafuta',          'maps_to' => 'cooking oil',        'language' => 'sw'],
            // English colloquial → canonical
            ['alias' => 'tomatos',         'maps_to' => 'tomatoes',           'language' => 'en'],
            ['alias' => 'tomatoe',         'maps_to' => 'tomatoes',           'language' => 'en'],
            ['alias' => 'ugali flour',     'maps_to' => 'unga wa mahindi',    'language' => 'en'],
            ['alias' => 'greens',          'maps_to' => 'sukuma wiki',        'language' => 'en'],
            ['alias' => 'kale',            'maps_to' => 'sukuma wiki',        'language' => 'en'],
            ['alias' => 'spuds',           'maps_to' => 'potatoes',           'language' => 'en'],
        ];

        foreach ($aliases as $alias) {
            SearchAlias::firstOrCreate(
                ['alias' => $alias['alias'], 'language' => $alias['language']],
                ['maps_to' => $alias['maps_to']]
            );
        }
    }
}
