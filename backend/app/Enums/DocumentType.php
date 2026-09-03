<?php

namespace App\Enums;

enum DocumentType: string
{
    case NOTA = 'nota';
    case STRUK = 'struk';
    case INVOICE = 'invoice';
    case FORM_TANPA_NOTA = 'form_tanpa_nota'; // sesuai BR-07
    case LAINNYA = 'lainnya';
}
