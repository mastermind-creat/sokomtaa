<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SiteVisit extends Model
{
    protected $fillable = [
        'session_hash',
        'user_id',
        'url',
        'path',
        'user_agent',
        'ip_address',
    ];
}
