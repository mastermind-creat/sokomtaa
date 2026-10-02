<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;

class ActivityExport implements FromCollection, WithHeadings, WithMapping
{
    protected $data;

    public function __construct($data)
    {
        $this->data = collect($data);
    }

    public function collection()
    {
        return $this->data;
    }

    public function headings(): array
    {
        return [
            'Date',
            'Reference',
            'Description',
            'Entity',
            'Amount (KES)',
            'Status'
        ];
    }

    public function map($row): array
    {
        return [
            $row['created_at'],
            $row['reference'],
            $row['description'],
            $row['entity'],
            number_format($row['total_amount'], 2),
            $row['status'] ?? 'N/A'
        ];
    }
}
