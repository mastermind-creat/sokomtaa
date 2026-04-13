<?php

namespace App\Exceptions;

class StallUnavailableException extends \Exception
{
    public function __construct(string $stallNumber)
    {
        parent::__construct("Stall '{$stallNumber}' is not available for allocation");
    }
}
