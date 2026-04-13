<?php

namespace App\Exceptions;

class TraderNotVerifiedException extends \Exception
{
    public function __construct()
    {
        parent::__construct('Trader profile has not been verified by admin yet');
    }
}
