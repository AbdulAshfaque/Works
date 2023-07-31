/**
 * Date Validation Directive
 *
 * This directive provides date validation for input fields with the date format 'mm/dd/yyyy' or 'dd/mm/yyyy'.
 * It restricts input to valid dates and enforces a range of valid years from 1000 to 9999.
 * The directive also supports automatic formatting of the date as the user types.
 * 
 * Usage:
 *   1. Import the DateValidationDirective in the parent module where it will be used.
 *   2. Add the 'appDateValidation' attribute to the input field that requires date validation.
 * 
 * Optional Inputs (can be passed as attributes on the directive):
 *   - dateFormat: Specify the date format ('mm/dd/yyyy' or 'dd/mm/yyyy'). The default format is 'mm/dd/yyyy'.
 *   - startYear: Set the start year for the valid range (e.g., 1000). The default start year is 1000.
 *   - endYear: Set the end year for the valid range (e.g., 9999). The default end year is 9999.
 * 
 * Example:
 *   <input type="text" appDateValidation [dateFormat]="'dd/mm/yyyy'" [startYear]="2000" [endYear]="2030">
 * 
 * Note:
 * This directive depends on the NgModel module, so ensure you have 'FormsModule' imported in your parent module.
 * 
 * Author: Abdul Ashfaque M
 */

import { Directive, ElementRef, OnInit, Renderer2, Input, HostListener } from '@angular/core';
import { NgModel } from '@angular/forms';

@Directive({
    selector: '[appDateValidation]',
    providers: [NgModel], // Provide the NgModel for data binding
})
export class DateValidationDirective implements OnInit {

    /**
     * Date Format
     * Specify the allowed date formats for the input field.
     * The available options are 'mm/dd/yyyy' or 'dd/mm/yyyy'.
     * The default format is 'mm/dd/yyyy'.
     */
    @Input() dateFormat: 'mm/dd/yyyy' | 'dd/mm/yyyy' = 'mm/dd/yyyy';

    /**
     * Start Year
     * Set the start year for the valid range of dates.
     * The input field will only accept dates with years greater than or equal to this value and less than 9999.
     * The default start year is 1000.
     */
    @Input() startYear = 1000;

    /**
     * End Year
     * Set the end year for the valid range of dates.
     * The input field will only accept dates with years less than or equal to this value and greater than 1000.
     * The default end year is 9999.
     */
    @Input() endYear = 9999;

    /**
     * Reference to the HTML element associated with the directive (input field).
     * 
     */
    private el: HTMLElement;

    /**
     * Variable to store the day part of the date.
     * 
     */
    day = '';
    /**
     * Variable to store the month part of the date.
     * 
     */
    month = '';

    /**
     * Variable to store the year part of the date.
     * 
     */
    year = '';

    /**
     * Variable to store the complete formatted date (in the format 'mm/dd/yyyy' or 'dd/mm/yyyy')
     * 
     */
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

    constructor(private _element: ElementRef, private _renderer: Renderer2, private _ngModel: NgModel) {
        this.el = this._element.nativeElement;
        this.el.style.paddingLeft = '10px';                 // Apply some styles to the input field
        this.el.style.fontSize = '1rem';
    }

    ngOnInit(): void {
        // Subscribe to value changes in the NgModel, if available
        if (this._ngModel?.valueChanges) {
            this._ngModel.valueChanges.subscribe((value: any) => {
                if (value) {
                    this.updateDate(value);
                }
            });
            // Clear the date if it's not valid after a short delay (500 milliseconds)
            setTimeout(() => {
                this.clearDateIfNotValid();
            }, 500)
        }
        this._renderer.setProperty(this.el, 'placeholder', this.dateFormat);
    }

    /**
     * Update the displayed date value in the user interface.
     *
     * Purpose: This function is responsible for updating the displayed date value in the user interface
     * based on the restricted input value provided as the 'value' parameter. The restricted input value
     * is obtained from the 'restrictInput' function, which presumably applies some validation or
     * formatting rules to ensure the date is in an expected format.
     *
     * @param value The date value entered by the user in the input element.
     */
    updateDate(value: string): void {
        this._renderer.setProperty(this.el, 'value', this.restrictInput(value));
    }

    /**
     * Restrict the input value to ensure a valid date format and a valid year range.
     *
     * Purpose: This function is responsible for validating and formatting the input date value
     * to ensure it has a valid date format and falls within the acceptable year range. The function
     * performs the following tasks:
     * - Rearranges the input value based on the selected date format and removes non-numeric and non-slash characters.
     * - Validates the year part of the date based on the acceptable year range (if a year divider exists).
     * - Clears day, month, and year parts from the input if they are not present or empty.
     *
     * @param value The input date value to be restricted and formatted.
     * @returns The formatted value with a maximum length of 10 characters representing the valid date.
     */
    restrictInput(value: string) {
        const monthDateDivider = this.findSlashPosition(value, 1);
        const DateYearDivider = this.findSlashPosition(value, 2);

        // Rearrange the input value based on the selected date format
        value = this.rearrangeBasedOnDateFormat(this.checkSlashPosition(value).replace(/[^0-9/]/g, ''), monthDateDivider, DateYearDivider);

        // Validate the year based on the valid year range
        if (DateYearDivider) {
            value = this.validateYear(value, DateYearDivider);
        }

        // Clear (day or month) and year if not present in the input
        this.clearSpecificPartOfDateIfEmpty(monthDateDivider, DateYearDivider);

        // Return the formatted value with a maximum length of 10 characters
        return value.substring(0, 10);
    }

    /**
     * Check the position of the slash (/) in the input value.
     *
     * Purpose: This function is responsible for examining the input value to determine the position of
     * the slash (/) character. It performs the following tasks:
     * - If the input value starts with a slash, it returns an empty string.
     * - If the input value contains more than two slash characters, it removes the slash after the third occurrence.
     *
     * @param value The input value to be analyzed for slash position.
     * @returns The updated input value with the correct number of slashes.
     */
    checkSlashPosition(value: string): string {
        if (value[0] === '/') {
            return '';
        } else if ((value.match(/\//g) || []).length > 2) {
            value = this.removeSlashAfterThirdOccurrence(value);
        }
        return value;
    }

    /**
     * Rearrange the input value based on the selected date format.
     *
     * Purpose: This function is responsible for rearranging the input value to match the specified
     * date format (e.g., 'mm/dd/yyyy' or 'dd/mm/yyyy'). It performs the following tasks:
     * - If the date format is 'mm/dd/yyyy', it validates and rearranges the input to ensure the
     *   correct month and day order. It calls 'validateMonthIfBeforeDay' or 'validateDayIfAfterMonth'
     *   based on the position of the month-date divider.
     * - If the date format is 'dd/mm/yyyy', it validates and rearranges the input to ensure the
     *   correct day and month order. It calls 'validateDayIfBeforeMonth' or 'validateMonthIfAfterDay'
     *   based on the position of the month-date divider and the date-year divider.
     *
     * @param value The input value representing a date to be rearranged.
     * @param monthDateDivider The position of the slash (/) that separates the month and day parts.
     * @param dateYearDivider The position of the slash (/) that separates the day and year parts (if available).
     * @returns The rearranged input value based on the selected date format.
     */
    rearrangeBasedOnDateFormat(value: string, monthDateDivider: number, dateYearDivider: number): string {
        const firstProcess = (value: string, monthDateDivider: number) => {
            return this.dateFormat === 'mm/dd/yyyy' ? this.validateMonthIfBeforeDay(value, monthDateDivider) :
                                                    this.validateDayIfBeforeMonth(value, monthDateDivider);
        };

        const secondProcess = (value: string, monthDateDivider: number, dateYearDivider: number) => {
            return this.dateFormat === 'mm/dd/yyyy' ? this.validateDayIfAfterMonth(value, monthDateDivider, dateYearDivider) :
                                                    this.validateMonthIfAfterDay(value, monthDateDivider, dateYearDivider);
        };

        value = firstProcess(value, monthDateDivider);

        if (monthDateDivider) {
            value = secondProcess(value, monthDateDivider, dateYearDivider);
        }

        return value;
    }

    /**
     * Validate the month if it appears before the day in the input value.
     *
     * Purpose: This function is responsible for validating and extracting the month part from the input
     * value if the month appears before the day (date format: 'mm/dd/yyyy'). It performs the following tasks:
     * - If the 'monthDateDivider' is not present (i.e., month and day are not separated), it assumes the
     *   entire input value as the month.
     * - It checks if the extracted month value is a valid month (1 to 12). If it is not valid, it returns
     *   the previously stored valid month value (stored in 'this.month').
     * - If the month is valid, it removes any leading zeros from the month value and returns the updated
     *   month value along with the rest of the input value.
     *
     * @param value The input value representing a date with the month before the day.
     * @param monthDateDivider The position of the slash (/) that separates the month and day parts.
     * @returns The updated input value with the validated month (without leading zeros) and the rest of the date.
     */
    validateMonthIfBeforeDay(value: string, monthDateDivider: number) {
        const month = !monthDateDivider ? value : value.slice(0, monthDateDivider);

        // Check if the extracted month value is a valid month (1 to 12)
        if (Number(month) > 12) {
            // If the month is not valid, return the previously stored valid month value (this.month).
            return this.month;
        }

        // Remove any leading zeros from the month value and update this.month
        this.month = this.removeLeadingZero(month);

        // Return the updated month value concatenated with the rest of the input value.
        return this.month + value.slice(month.length);
    }

    /**
     * Validate the month if it appears after the day in the input value.
     *
     * Purpose: This function is responsible for validating and extracting the month part from the input
     * value if the month appears after the day (date format: 'dd/mm/yyyy'). It performs the following tasks:
     * - It calculates the starting and ending positions of the month substring based on the 'monthDateDivider'
     *   and 'dateYearDivider' values to extract the month part correctly.
     * - If 'dateYearDivider' is not present (i.e., day and year are not separated), it assumes the remaining
     *   part of the input value after the 'monthDateDivider' as the month.
     * - It checks if the extracted month value is a valid month (1 to 12) and if it matches the valid number of
     *   days in the given month. If the month or the day is not valid, it returns the previously stored valid
     *   month value (stored in 'this.month') concatenated with the day part.
     * - If both the month and day are valid, it removes any leading zeros from the month value, updates the
     *   stored valid month value ('this.month'), and returns the updated input value with the correct month.
     *
     * @param value The input value representing a date with the month after the day.
     * @param monthDateDivider The position of the slash (/) that separates the day and month parts.
     * @param dateYearDivider The position of the slash (/) that separates the month and year parts (if available).
     * @returns The updated input value with the validated month (without leading zeros) and the rest of the date.
     */
    validateMonthIfAfterDay(value: string, monthDateDivider: number, dateYearDivider: number) {
        const limit: number = monthDateDivider + 1;
        const monthStartIndex: number = this.day.length + 1;
        const valueBeforeMonthDateDivider: string = value.slice(0, limit);
        const month: string = !dateYearDivider ? 
                            value.slice(limit) :
                            value.slice(limit, dateYearDivider);

        // If the day is '0', return the input value before the monthDateDivider.
        if (this.day === '0') {
            return value.slice(0, monthDateDivider);
        }
        // If the month is empty, return the input value without the month part including monthDateDivider.
        else if (month === '') {
            return valueBeforeMonthDateDivider;
        }
        // Check if the extracted month value is a valid month (1 to 12) and if the day is within the valid range for that month.
        else if (Number(month) > 12 || Number(this.day) > this.getNoOfDays(month)) {
            // If the month or day is not valid, return the previously stored valid month value (this.month) concatenated with the day part.
            return valueBeforeMonthDateDivider + this.month;
        }

        // Remove any leading zeros from the month value and update this.month
        this.month = this.removeLeadingZero(month);

        // Return the updated input value with the correct month part.
        return value.slice(0, monthStartIndex) + this.month + value.slice(monthStartIndex + month?.length);
    }

    /**
     * Validate the day if it appears before the month in the input value.
     *
     * Purpose: This function is responsible for validating and extracting the day part from the input
     * value if the day appears before the month (date format: 'mm/dd/yyyy'). It performs the following tasks:
     * - If the 'monthDateDivider' is not present (i.e., month and day are not separated), it assumes the
     *   entire input value as the day.
     * - It checks if the extracted day value is a valid day (1 to 31). If it is not valid, it returns the
     *   previously stored valid day value (stored in 'this.day').
     * - If the day is valid, it removes any leading zeros from the day value and returns the updated
     *   day value along with the rest of the input value.
     *
     * @param value The input value representing a date with the day before the month.
     * @param monthDateDivider The position of the slash (/) that separates the month and day parts.
     * @returns The updated input value with the validated day (without leading zeros) and the rest of the date.
     */
    validateDayIfBeforeMonth(value: string, monthDateDivider: number) {
        const day = !monthDateDivider ? value : value.slice(0, monthDateDivider);

        // Check if the extracted day value is a valid day (1 to 31).
        if (Number(day) > 31) {
            // If the day is not valid, return the previously stored valid day value (this.day).
            return this.day;
        }

        // Remove any leading zeros from the day value and update this.day
        this.day = this.removeLeadingZero(day);

        // Return the updated day value concatenated with the rest of the input value.
        return this.day + value.slice(day.length);
    }

    /**
     * Validate the day if it appears after the month in the input value.
     *
     * Purpose: This function is responsible for validating and extracting the day part from the input
     * value if the day appears after the month (date format: 'dd/mm/yyyy'). It performs the following tasks:
     * - It calculates the starting and ending positions of the day substring based on the 'monthDateDivider'
     *   and 'dateYearDivider' values to extract the day part correctly.
     * - If 'dateYearDivider' is not present (i.e., month and year are not separated), it assumes the remaining
     *   part of the input value after the 'monthDateDivider' as the day.
     * - It checks if the extracted day value is a valid day for the given month. If the day is not valid, it returns
     *   the previously stored valid day value (stored in 'this.day') concatenated with the month part.
     * - If the day is valid, it removes any leading zeros from the day value, updates the stored valid day value ('this.day'),
     *   and returns the updated input value with the correct day.
     *
     * @param value The input value representing a date with the day after the month.
     * @param monthDateDivider The position of the slash (/) that separates the month and day parts.
     * @param dateYearDivider The position of the slash (/) that separates the day and year parts (if available).
     * @returns The updated input value with the validated day (without leading zeros) and the rest of the date.
     */
    validateDayIfAfterMonth(value: string, monthDateDivider: number, dateYearDivider: number) {
        const limit: number = monthDateDivider + 1;
        const totalDays: number = this.getNoOfDays();
        const dayStartIndex: number = this.month.length + 1;
        const valueBeforeMonthDateDivider: string = value.slice(0, limit);
        const day: string = !dateYearDivider ? 
                            value.slice(limit) :
                            value.slice(limit, dateYearDivider);

        // If the month is '0', return the input value before the monthDateDivider.
        if (this.month === '0') {
            return value.slice(0, monthDateDivider);
        }
        // If the day is empty, return the input value after removing value monthDateDivider.
        else if (day === '') {
            return valueBeforeMonthDateDivider;
        }
        // Check if the extracted day value is a valid day for the given month.
        else if (Number(day) > totalDays) {
            // If the day is not valid, return the previously stored valid day value (this.day) concatenated with the month part.
            return valueBeforeMonthDateDivider + this.day;
        }

        // Remove any leading zeros from the day value and update this.day
        this.day = this.removeLeadingZero(day);

        // Return the updated input value with the correct day part.
        return value.slice(0, dayStartIndex) + this.day + value.slice(dayStartIndex + day?.length);
    }

    /**
     * Validate the year based on the valid year range and check for leap year conditions.
     *
     * Purpose: This function is responsible for validating the year part of the date obtained from the input value.
     * It ensures that the year falls within the acceptable year range (startYear to endYear), and it checks for
     * specific leap year conditions for February 29th. It performs the following tasks:
     * - If the 'dateYearDivider' is not present (i.e., year is not separated), it assumes the entire input value as the year.
     * - If the day or month is '0', it returns the input value without the year part.
     * - If the year is present, it checks if it has a valid format and falls within the valid year range. If not, it returns
     *   the input value with the previously stored valid year value (stored in 'this.year').
     * - If the date is February 29th and the year is a 4-digit number, it checks for leap year conditions. If the year is not
     *   a leap year, it returns the input value without the last character (i.e., the invalid day).
     *
     * @param value The input value representing a date with the year part to be validated.
     * @param dateYearDivider The position of the slash (/) that separates the day and year parts (if available).
     * @returns The updated input value with the validated year and the rest of the date (if year is valid).
     */
    validateYear(value: string, dateYearDivider: number) {
        const year: string = dateYearDivider ? value.slice(dateYearDivider + 1) : '';
        const previousValue: string = value.substring(0, dateYearDivider + 1) + this.year;

        // If the day or month is '0', return the input value without the year part.
        if (this.day === '0' || this.month === '0') {
            return value.slice(0, dateYearDivider);
        }

        // If the year is present, check if it has a valid format and falls within the valid year range.
        if (year) {
            const yearInNumber: number = Number(year);

            // Check for valid year format (no leading zeros) and year range.
            if (year[0] === '0' || ((year.length >= 4) && (yearInNumber < this.startYear) || (yearInNumber > this.endYear))) {
                // If the year is not valid, return the previous value with the previously stored valid year (this.year).
                return previousValue;
            }

            // If the date is February 29th and the year is a 4-digit number, check for leap year conditions.
            if ((this.month === '2' || this.month === '02') && this.day === '29' && year.length === 4) {
                if (!this.checkIsLeapYear(year)) {
                    // If the year is not a leap year, return the input value without the last character (i.e., the invalid day).
                    return value.substring(0, value.length - 1);
                }
            }
        }

        // Update the stored valid year value (this.year) and return the input value with the validated year.
        this.year = year;
        return value;
    }

    /**
     * Clear the date if it is not a valid date within the specified year range.
     *
     * Purpose: This function is responsible for clearing the displayed date if any of the following conditions are met:
     * - The 'day' or 'month' value is not present (i.e., the date is incomplete).
     * - The 'year' value is not a valid year within the specified 'startYear' and 'endYear' range.
     * If any of these conditions are met, the function sets the input element's value to an empty string.
     * Otherwise, if the date is valid, it formats and sets the 'date' property to 'day/month/year'.
     */
    clearDateIfNotValid() {
        if ((!this.day || !this.month || (Number(this.year) < this.startYear) || (Number(this.year) > this.endYear))) {
            // If the day, month, or year is not present or the year is not within the valid range, clear the displayed date.
            this._renderer.setProperty(this.el, 'value', '');
        } else {
            // If the date is valid, format and set the 'date' property to 'day/month/year'.
            this.date = this.day + '/' + this.month + '/' + this.year;
        }
    }

    /**
     * Clear specific parts of the date if they are empty based on the selected date format.
     *
     * Purpose: This function is responsible for clearing specific parts of the date (day, month, or year) if they are empty
     * based on the selected date format ('dd/mm/yyyy' or 'mm/dd/yyyy'). It performs the following tasks:
     * - If the date format is 'dd/mm/yyyy', it clears the 'month' part if the 'monthDateDivider' is not present.
     * - If the date format is 'mm/dd/yyyy', it clears the 'day' part if the 'monthDateDivider' is not present.
     * - It clears the 'year' part if the 'dateYearDivider' is not present.
     *
     * @param monthDateDivider The position of the slash (/) that separates the month and day parts.
     * @param dateYearDivider The position of the slash (/) that separates the day and year parts (if available).
     */
    clearSpecificPartOfDateIfEmpty(monthDateDivider: number, dateYearDivider: number) {
        if (this.dateFormat === 'dd/mm/yyyy') {
            // If the date format is 'dd/mm/yyyy', clear the 'month' part if the 'monthDateDivider' is not present.
            this.month = !monthDateDivider ? '' : this.month;
        } else {
            // If the date format is 'mm/dd/yyyy', clear the 'day' part if the 'monthDateDivider' is not present.
            this.day = !monthDateDivider ? '' : this.day;
        }
        
        // Clear the 'year' part if the 'dateYearDivider' is not present.
        this.year = !dateYearDivider ? '' : this.year;
    }

    /**
     * Find the position of the slash (/) in the input value.
     *
     * Purpose: This function is responsible for finding the position of the slash (/) in the input value.
     * It counts the number of occurrences of the slash and returns the position of the 'limit'-th occurrence.
     * The function is typically used to identify the position of slashes in date formats to separate day, month, and year.
     *
     * @param value The input value in which the slash position needs to be found.
     * @param limit The number of the occurrence of the slash to find (e.g., 1 for the first slash, 2 for the second slash).
     * @returns The position of the 'limit'-th occurrence of the slash in the input value, or 0 if not found.
     */
    findSlashPosition(value: string, limit: number): number {
        let count = 0;

        // Iterate through the input value to find the position of the 'limit'-th occurrence of the slash.
        for (let i = 0; i < value.length; i++) {
            if (value[i] === '/') {
                count++;
                if (count === limit) {
                    // If the 'limit'-th occurrence of the slash is found, return its position (index).
                    return i;
                }
            }
        }

        // If the 'limit'-th occurrence of the slash is not found, return 0.
        return 0;
    }

    /**
     * Remove the slash (/) after the third occurrence in the input value.
     *
     * Purpose: This function is responsible for removing the slash (/) that appears after the third occurrence
     * in the input value. It uses the 'findSlashPosition' function to identify the position of the third slash
     * and then removes the slash and any characters after it. This is typically used to handle date formats that
     * contain multiple slashes (e.g., 'dd/mm/yyyy') and ensure that the input value follows the expected format.
     *
     * @param value The input value containing slashes to be processed.
     * @returns The input value with the slash and characters after the third occurrence removed, if present.
     */
    removeSlashAfterThirdOccurrence(value: string): string {
        // Find the position of the third slash (/) in the input value.
        const position: number = this.findSlashPosition(value, 3);

        // If the third slash is found, remove the slash and any characters after it.
        return position > 0 ? value.substring(0, position) : value;
    }

    /**
     * Check if the given year is a leap year.
     *
     * Purpose: This function is responsible for determining whether the given year is a leap year or not.
     * It checks the year for leap year conditions and returns true if it is a leap year, and false otherwise.
     * Leap years occur every 4 years, except for years that are divisible by 100 but not by 400.
     * This function is commonly used to handle special cases related to February 29th in date validations.
     *
     * @param leapYear The year to be checked as a leap year (as a string).
     * @returns True if the given year is a leap year, false otherwise.
     */
    checkIsLeapYear(leapYear: string): boolean {
        const year = Number(leapYear);

        // Check leap year conditions: divisible by 4 and not divisible by 100, or divisible by 400.
        if ((year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0)) {
            return true;
        }

        // If the year does not meet leap year conditions, return false.
        return false;
    }

    /**
     * Get the number of days in a given month or the current month if not provided.
     *
     * Purpose: This function is responsible for determining the number of days in a given month or the current month
     * (stored in 'this.month') if the 'month' parameter is not provided. It returns the number of days based on the month,
     * considering leap years for February. The function is commonly used in date-related calculations to handle varying
     * days in different months, including special cases like February's varying days in leap years.
     *
     * @param month The month for which the number of days needs to be obtained (default: the current 'this.month').
     * @returns The number of days in the specified month or the current month.
     */
    getNoOfDays(month: string = this.month): number {
        const februaryDays = 29; // Number of days in February, including leap years.
        const thirtyDaysMonths = [4, 6, 9, 11]; // Months with 30 days: April, June, September, November.
        const thirtyOneDaysMonths = [1, 3, 5, 7, 8, 10, 12]; // Months with 31 days: January, March, May, July, August, October, December.

        // If the 'month' parameter is not provided, return the number of days in the current month (this.month).
        if (!month) {
            return 31; // Default to 31 days for convenience.
        }

        // Determine the number of days based on the month.
        return thirtyOneDaysMonths.includes(Number(month)) ? 31 :
            thirtyDaysMonths.includes(Number(month)) ? 30 :
            februaryDays; // Return 29 days for February as a default value for convenience.
    }

    /**
     * Remove leading zeros from the input string, except for the number 0.
     *
     * Purpose: This function is responsible for removing leading zeros from the input string, except for the number 0.
     * It is typically used to ensure that numeric values are correctly formatted without leading zeros, while still
     * preserving the single digit 0. The function checks if the number is greater than 9 and removes any leading zeros
     * if present. However, it ensures that the number 0 remains unchanged, as removing its leading zero would change
     * its value. The function is commonly used in date validations and formatting to handle single and double-digit numbers.
     *
     * @param input The input string containing the number to process.
     * @returns The input string with leading zeros removed, except for the number 0.
     */
    removeLeadingZero(input: string): string {
        // Check if the number is greater than 9 and remove any leading zeros if present.
        if (Number(input) > 9) {
            if (/^0+/.test(input)) {
                return input.replace(/^0+/, '');
            }
        }

        // If the number is less than or equal to 9, ensure it has a leading zero if necessary.
        return input.replace(/^0+/, '0');
    }

}