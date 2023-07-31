/**
 * Date Validation Directive
 *
 * This directive provides date validation for input fields with date format 'mm/dd/yyyy' or 'dd/mm/yyyy'.
 * It restricts input to valid dates and enforces a range of valid years (1000 to 9999).
 * The directive also supports automatically formatting the date while the user types.
 *
 * Usage:
 * 1. Import the DateValidationDirective in the parent module where it will be used.
 * 2. Add the 'appDateValidation' attribute to the input field that requires date validation.
 * 3. Optional: Provide the following inputs to customize the behavior of the directive:
 *    - dateFormat: Specify the date format ('mm/dd/yyyy' or 'dd/mm/yyyy'). Default is 'mm/dd/yyyy'.
 *    - startYear: Set the start year for the valid range (e.g., 1000). Default is 1000.
 *    - endYear: Set the end year for the valid range (e.g., 9999). Default is 9999.
 *
 * Example:
 * <input type="text" appDateValidation [dateFormat]="'dd/mm/yyyy'" [startYear]="2000" [endYear]="2030">
 *
 * Note: This directive depends on the NgModel module, so ensure you have 'FormsModule' imported in your parent module.
 */

// Import necessary Angular modules and dependencies
import { Directive, ElementRef, OnInit, Renderer2, Input, HostListener } from '@angular/core';
import { NgModel } from '@angular/forms';

@Directive({
    selector: '[appDateValidation]',
    providers: [NgModel], // Provide the NgModel for data binding
})
export class DateValidationDirective implements OnInit {
    // Define inputs for the directive
    @Input() dateFormat: 'mm/dd/yyyy' | 'dd/mm/yyyy' = 'mm/dd/yyyy'; // Specify the allowed date formats
    @Input() startYear = 1000; // Set the start year for the valid range
    @Input() endYear = 9999; // Set the end year for the valid range

    // Variables to store individual parts of the date
    private el: HTMLElement;
    day = '';
    month = '';
    year = '';
    date = '';

    // Listen to the 'input' event on the input field and update the date accordingly
    @HostListener('input', ['$event.target.value'])
    onInput(value: any): void {
        this.updateDate(value);
    }

    // Listen to the 'input' event on the input field and update the date accordingly
    @HostListener('focus', ['$event.target.value'])
    onFocus(value: any): void {
        this.updateDate(value);
        this.clearDateIfNotValid();
    }

    // Listen to the 'blur' event on the input field and clear the date if it's not valid
    @HostListener('blur', ['$event.target.value'])
    onBlur(value: any): void {
        this.updateDate(value);
        this.clearDateIfNotValid();
    }

    // Constructor of the directive
    constructor(public element: ElementRef, private renderer: Renderer2, private ngModel: NgModel) {
        this.el = this.element.nativeElement;
        this.el.style.paddingLeft = '10px'; // Apply some styles to the input field
        this.el.style.fontSize = '1rem';
        this.renderer.setProperty(this.el, 'placeholder', this.dateFormat); // Set the placeholder with the selected date format
    }

    // Initialize the directive when it's initialized
    ngOnInit(): void {
        // Subscribe to value changes in the NgModel, if available
        if (this.ngModel?.valueChanges) {
            this.ngModel.valueChanges.subscribe((value: any) => {
                if (value) {
                    this.updateDate(value);
                }
            });

            // Clear the date if it's not valid after a short delay (500 milliseconds)
            setTimeout(() => {
                this.clearDateIfNotValid();
            }, 500);
        }
    }

    // Update the displayed date value based on the input value
    updateDate(value: string): void {
        this.renderer.setProperty(this.el, 'value', this.restrictInput(value));
    }

    // Restrict the input value to ensure valid date format and valid year range
    restrictInput(value: string) {
        const monthDateDivider = this.findSlashPosition(value, 1);
        const DateYearDivider = this.findSlashPosition(value, 2);

        // Rearrange the input value based on the selected date format
        value = this.rearrangeBasedOnDateFormat(this.checkSlashPosition(value).replace(/[^0-9/]/g, ''), monthDateDivider, DateYearDivider);

        // Validate the year based on the valid year range
        if (DateYearDivider) {
            value = this.validateYear(value, DateYearDivider);
        }

        // Clear day, month, and year parts if not present in the input
        if (this.dateFormat == 'dd/mm/yyyy') {
            this.month = !monthDateDivider ? '' : this.month;
        } else {
            this.day = !monthDateDivider ? '' : this.day;
        }
        this.year = !DateYearDivider ? '' : this.year;

        // Return the formatted value with a maximum length of 10 characters
        return value.substring(0, 10);
    }

    // Check the position of the slash (/) in the input value
    checkSlashPosition(value: string): string {
        if (value[0] == '/') {
            return '';
        } else if ((value.match(/\//g) || []).length > 2) {
            value = this.removeSlashAfterThirdOccurrence(value);
        }
        return value;
    }

    // Rearrange the input value based on the selected date format
    rearrangeBasedOnDateFormat(value: string, monthDateDivider: number, DateYearDivider: number): string {
        const firstProcess = (value: string, monthDateDivider: number) => {
            return this.dateFormat === 'mm/dd/yyyy' ? this.validateMonthIfBeforeDay(value, monthDateDivider) :
                                                      this.validateDayIfBeforeMonth(value, monthDateDivider);
        };

        const secondProcess = (value: string, monthDateDivider: number, DateYearDivider: number) => {
            return this.dateFormat === 'mm/dd/yyyy' ? this.validateDayIfAfterMonth(value, monthDateDivider, DateYearDivider) :
                                                      this.validateMonthIfAfterDay(value, monthDateDivider, DateYearDivider);
        };

        value = firstProcess(value, monthDateDivider);

        if (monthDateDivider) {
            value = secondProcess(value, monthDateDivider, DateYearDivider);
        }
        
        return value;
    }

    // Validate the month if it appears before the day in the input value
    validateMonthIfBeforeDay(value: string, monthDateDivider: number) {
        const month = !monthDateDivider ? value : value.slice(0, monthDateDivider);
        if (Number(month) > 12) {
            return this.month;
        }
        this.month = this.removeLeadingZero(month)
        return this.month + value.slice(month.length);
    }

    // Validate the month if it appears after the day in the input value
    validateMonthIfAfterDay(value: string, monthDateDivider: number, DateYearDivider: number) {
        const limit: number = monthDateDivider + 1;
        const monthStartIndex: number = this.day.length + 1;
        const valueBeforeMonthDateDivider: string = value.slice(0, limit);
        const month: string = !DateYearDivider ? 
                            value.slice(limit) :
                            value.slice(limit, DateYearDivider);   
        if (this.day === '0') {
            return value.slice(0, monthDateDivider);
        } else if (month === '') {
            return valueBeforeMonthDateDivider;
        } else if (Number(month) > 12 || Number(this.day) > this.getNoOfDays(month)) {
            return valueBeforeMonthDateDivider + this.month;
        }

        this.month = this.removeLeadingZero(month)
        return value.slice(0, monthStartIndex) + this.month + value.slice(monthStartIndex + month?.length);
    }

    // Validate the day if it appears before the month in the input value
    validateDayIfBeforeMonth(value: string, monthDateDivider: number) {
        const day = !monthDateDivider ? value : value.slice(0, monthDateDivider);

        if (Number(day) > 31) {
            return this.day;
        }
        this.day = this.removeLeadingZero(day)
        return this.day + value.slice(day.length);
    }

    // Validate the day if it appears after the month in the input value
    validateDayIfAfterMonth(value: string, monthDateDivider: number, DateYearDivider: number) {
        const limit: number = monthDateDivider + 1;
        const totalDays: number = this.getNoOfDays();
        const dayStartIndex: number = this.month.length + 1;
        const valueBeforeMonthDateDivider: string = value.slice(0, limit);
        const day: string = !DateYearDivider ? 
                            value.slice(limit) :
                            value.slice(limit, DateYearDivider);

        if (this.month === '0') {
            return value.slice(0, monthDateDivider);
        } else if (day === '') {
            return valueBeforeMonthDateDivider;
        } else if (Number(day) > totalDays) {
            return valueBeforeMonthDateDivider + this.day;
        }

        this.day = this.removeLeadingZero(day)
        return value.slice(0, dayStartIndex) + this.day + value.slice(dayStartIndex + day?.length);
    }

    // Validate the year and restrict it to the valid year range
    validateYear(value: string, DateYearDivider: number) {
        const year: string = DateYearDivider ? value.slice(DateYearDivider + 1) : '';
        const previousValue: string = value.substring(0, DateYearDivider + 1) + this.year;

        if (this.day === '0' || this.month === '0') {
            return value.slice(0, DateYearDivider);
        }
        
        if (year) {
            const yearInNumber: number = Number(year)
            if (year[0] === '0' || ((year.length >= 4) && ( yearInNumber < this.startYear) || (yearInNumber > this.endYear))) {
                return previousValue;
            }

            // Check if February 29 is valid in the selected year (considering leap years)
            if ((this.month === '2' || this.month === '02') && this.day === '29' && year.length === 4) {
                if (!this.checkIsLeapYear(year)) {
                    return value.substring(0, value.length - 1);
                }
            }
        }
    
        this.year = year;
        return value;
    }

    // Clear the input field if the date is not valid
    clearDateIfNotValid() {
        if ((!this.day || !this.month || (Number(this.year) < this.startYear) || (Number(this.year) > this.endYear))) {
            this.renderer.setProperty(this.el, 'value', '');
        } else {
            this.date = this.day + '/' + this.month + '/' + this.year
        }
    }

    // Find the position of the slash (/) in the input value
    findSlashPosition(value: string, limit: number): number {
        let count = 0;
    
        for (let i = 0; i < value.length; i++) {
            if (value[i] === '/') {
                count++;
                if (count === limit) {
                    return i;
                }
            }
        }

        return 0;
    }

    // Remove the slash (/) after the third occurrence in the input value
    removeSlashAfterThirdOccurrence(value: string): string {
        const position: number = this.findSlashPosition(value, 3);
        return position > 0 ? value.substring(0, position) : value;
    }

    // Check if the given year is a leap year
    checkIsLeapYear(leapYear: string): boolean {
        const year = Number(leapYear);
        if ((year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0)) {
            return true;
        } 
        return false;
    }

    // Get the number of days in a given month (default: current month)
    getNoOfDays(month: string = this.month): number {
        const februaryDays = 29;                                        // including leap years
        const thirtyDaysMonths = [4, 6, 9, 11];                         // April, June, September, November
        const thirtyOneDaysMonths = [1, 3, 5, 7, 8, 10, 12];            // January, March, May, July, August, October, December

        if (!month) {
            return 31;
        }

        return thirtyOneDaysMonths.includes(Number(month)) ? 31 :
               thirtyDaysMonths.includes(Number(month)) ? 30 :
               februaryDays;
    }

    // Remove leading zeros from the input
    removeLeadingZero(input: string): string {
        if (Number(input) > 9) {
            if (/^0+/.test(input)) {
                return input.replace(/^0+/, '');
            }
        }
        return input.replace(/^0+/, '0');
    }
}
