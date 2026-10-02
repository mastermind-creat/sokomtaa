<?php

namespace App\Exceptions;

class ServiceUnavailableException extends \RuntimeException
{
    public function __construct(string $message = 'AI service is temporarily unavailable')
    {
        parent::__construct($message);
    }
}
