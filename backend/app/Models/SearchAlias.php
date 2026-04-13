<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SearchAlias extends Model
{
    protected $fillable = [
        'alias',
        'maps_to',
        'language',
    ];
}
