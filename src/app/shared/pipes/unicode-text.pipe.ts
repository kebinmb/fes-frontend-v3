import { Pipe, PipeTransform } from '@angular/core';
import { normalizeUnicode, repairSpecialCharacters } from '@utilities/normalize-text';

@Pipe({
  name: 'unicodeText',
  standalone: true,
})
export class UnicodeTextPipe implements PipeTransform {
  transform(
    value: string | number | null | undefined,
    casing: 'none' | 'upper' = 'none',
  ): string {
    const text = normalizeUnicode(
      repairSpecialCharacters(value == null ? '' : String(value)),
    );

    return casing === 'upper'
      ? text.toLocaleUpperCase('en-PH')
      : text;
  }
}
