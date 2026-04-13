<?php

namespace App\Exceptions;

class OutOfStockException extends \Exception
{
    public function __construct(string $productName)
    {
        parent::__construct("'{$productName}' is currently out of stock");
    }
}
