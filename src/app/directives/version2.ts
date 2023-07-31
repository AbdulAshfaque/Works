import { Directive, ElementRef, OnInit, Renderer2, Input, HostListener } from '@angular/core';
import { NgModel } from '@angular/forms';

@Directive({
    selector: '[appDateValidation]',
    providers: [NgModel],
})
export class DateValidationDirective implements OnInit {

    @Input() dateFormat : 'mm/dd/yyyy' | 'dd/mm/yyyy' = 'mm/dd/yyyy';    // Has limitation ie, only two date formats are allowed.
    @Input() startYear = 1000;                                           // start year and end year should be between 1000 to 9999.
    @Input() endYear = 9999;                                             // ie, it should a 4 digit year.
    @Input() isShowError = true;
    
    private el: HTMLElement;
    private errorDiv: HTMLDivElement | null = null;

    day = '';
    month = '';
    year = '';
    date = '';
    dateErrorMessage = '';

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
        this.el.style.paddingLeft = '10px';
        this.el.style.fontSize = '1rem'
    }

    ngOnInit(): void {
        if (this._ngModel?.valueChanges) {
            this._ngModel.valueChanges.subscribe((value: any) => {
                if (value) {
                    this.updateDate(value);
                }
            });
            setTimeout(() => {
                this.clearDateIfNotValid();
            }, 500)
        }
        this._renderer.setProperty(this.el, 'placeholder', this.dateFormat)
        if (!this.errorDiv) {
            this.errorDiv = this._renderer.createElement('div');
        }
    }

    updateDate(value: string): void {
        this.removeErrorMessage();
        this._renderer.setProperty(this.el, 'value', this.restrictInput(value));
    }

    restrictInput(value: string) {
        const monthDateDivider = this.findSlashPosition(value, 1);
        const DateYearDivider = this.findSlashPosition(value, 2);

        if ((/[^0-9/]/.test(value))) {
            this.dateErrorMessage = 'Please enter numbers 0 to 9 and the symbol "/".';
            this.showErrorMessage();
        } 

        value = this.rearrangeBasedOnDateFormat(this.checkSlashPosition(value).replace(/[^0-9/]/g, ''), monthDateDivider, DateYearDivider);

        this.clearSpecificPartOfDateIfEmpty(monthDateDivider, DateYearDivider);

        return value.substring(0, 10);
    }

    clearSpecificPartOfDateIfEmpty(monthDateDivider: number, dateYearDivider: number) {
        if (this.dateFormat === 'dd/mm/yyyy') {
            this.month = !monthDateDivider ? '' : this.month;
        } else {
            this.day = !monthDateDivider ? '' : this.day;
        }
        
        this.year = !dateYearDivider ? '' : this.year;
    }

    checkSlashPosition(value: string): string {
        if (value[0] == '/') {
            this.dateErrorMessage = 'Please start with digits.'
            this.showErrorMessage();
            return '';
        } else if ((value.match(/\//g) || []).length > 2) {
            value = this.removeSlashAfterThirdOccurrence(value);
        }
        return value;
    }

    rearrangeBasedOnDateFormat(value: string, monthDateDivider: number, DateYearDivider: number): string {
        const firstProcess = (value: string, monthDateDivider: number) => {
            return this.dateFormat === 'mm/dd/yyyy' ? this.validateMonthIfBeforeDay(value, monthDateDivider) :
                                                      this.validateDayIfBeforeMonth(value, monthDateDivider);
        };

        const secondPorcess = (value: string, monthDateDivider: number, DateYearDivider: number) => {
            return this.dateFormat === 'mm/dd/yyyy' ? this.validateDayIfAfterMonth(value, monthDateDivider, DateYearDivider) :
                                                      this.validateMonthIfAfterDay(value, monthDateDivider, DateYearDivider);
        };

        value = firstProcess(value, monthDateDivider);

        if (monthDateDivider) {
            value = secondPorcess(value, monthDateDivider, DateYearDivider);
        }
        
        return value;
    }

    validateMonthIfBeforeDay(value: string, monthDateDivider: number) {
        const month = !monthDateDivider ? value : value.slice(0, monthDateDivider);
        if (Number(month) > 12) {
            this.dateErrorMessage = 'Please enter a valid month.'
            this.showErrorMessage();
            return this.month;
        }
        this.month = this.removeLeadingZero(month)
        return this.month + value.slice(month.length);
    }

    validateMonthIfAfterDay(value: string, monthDateDivider: number, DateYearDivider: number) {
        const limit: number = monthDateDivider + 1;
        const monthStartIndex: number = this.day.length + 1;
        const valueBeforeMonthDateDivider: string = value.slice(0, limit);
        const month: string = !DateYearDivider ? 
                            value.slice(limit) :
                            value.slice(limit, DateYearDivider);   
        if (this.day === '0') {
            this.dateErrorMessage = 'Please enter a valid day.'
            this.showErrorMessage();
            return value.slice(0, monthDateDivider);
        } else if (value[limit] && month === '') {
                this.dateErrorMessage = 'Please enter a valid month.'
                this.showErrorMessage();
                return valueBeforeMonthDateDivider;
        } else if (Number(month) > 12 || ((Number(this.day) > this.getNoOfDays(month)) && month !== '0')) {
            this.dateErrorMessage = 'Please enter a valid month.'
            this.showErrorMessage();
            return valueBeforeMonthDateDivider + this.month;
        }

        this.month = this.removeLeadingZero(month)
        return value.slice(0, monthStartIndex) + this.month + value.slice(monthStartIndex + month?.length);
    }

    validateDayIfBeforeMonth(value: string, monthDateDivider: number) {
        const day = !monthDateDivider ? value : value.slice(0, monthDateDivider);

        if (Number(day) > 31) {
            this.dateErrorMessage = 'Please enter a valid day.'
            this.showErrorMessage();
            return this.day;
        }
        this.day = this.removeLeadingZero(day)
        return this.day + value.slice(day.length);
    }

    validateDayIfAfterMonth(value: string, monthDateDivider: number, DateYearDivider: number) {
        const limit: number = monthDateDivider + 1;
        const totalDays: number = this.getNoOfDays();
        const dayStartIndex: number = this.month.length + 1;
        const valueBeforeMonthDateDivider: string = value.slice(0, limit);
        const day: string = !DateYearDivider ? 
                            value.slice(limit) :
                            value.slice(limit, DateYearDivider);

        if (this.month === '0') {
            this.dateErrorMessage = 'Please enter a valid month.'
            this.showErrorMessage();
            return value.slice(0, monthDateDivider);
        } else if (value[limit] && day === '') {
            this.dateErrorMessage = 'Please enter a valid day.'
            this.showErrorMessage();
            return valueBeforeMonthDateDivider;
        } else if (Number(day) > totalDays) {
            this.dateErrorMessage = 'Please enter a valid day.'
            this.showErrorMessage();
            return valueBeforeMonthDateDivider + this.day;
        }

        this.day = this.removeLeadingZero(day)
        return value.slice(0, dayStartIndex) + this.day + value.slice(dayStartIndex + day?.length);
    }

    validateYear(value: string, DateYearDivider: number) {
        const year: string = DateYearDivider ? value.slice(DateYearDivider + 1) : '';
        const previousValue: string = value.substring(0, DateYearDivider + 1) + this.year;

        if (this.day === '0' || this.month === '0') {
            this.dateErrorMessage = 'Please enter a valid date.'
            this.showErrorMessage();
            return value.slice(0, DateYearDivider);
        }
        
        if (year) {
            const yearInNumber: number = Number(year)
            if (year[0] === '0' || ((year.length >= 4) && ( yearInNumber < this.startYear) || (yearInNumber > this.endYear))) {
                this.dateErrorMessage = `Please enter an year between ${this.startYear} and ${this.endYear}.`
                this.showErrorMessage();
                return previousValue;
            }

            if ((this.month === '2' || this.month === '02')  && this.day === '29' && year.length === 4) {
                if (!this.checkIsLeapYear(year)) {
                    this.dateErrorMessage = 'Please enter a valid leap year.'
                    this.showErrorMessage();
                    return value.substring(0, value.length - 1);
                }
            }
        }
    
        this.year = year;
        return value;
    }

    clearDateIfNotValid() {
        if ((!this.day || !this.month || (Number(this.year) < this.startYear) || (Number(this.year) > this.endYear))) {
            this.removeErrorMessage();
            this.showErrorMessage();
            this._renderer.setProperty(this.el, 'value', '');
        } else {
            this.date = this.day + '/' + this.month + '/' + this.year
        }
    }

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

    removeSlashAfterThirdOccurrence(value: string): string {
        const position: number = this.findSlashPosition(value, 3);

        if (this.day && this.month && position) {
            this.dateErrorMessage =  'Please enter a valid ' + ((this.day === '29' && this.month === '2') ? 'leap year.' : 'year.');
            this.showErrorMessage();
        }

        return position > 0 ? value.substring(0, position) : value;
    }

    checkIsLeapYear(leapYear: string): boolean {
        const year = Number(leapYear);
        if ((year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0)) {
            return true;
        } 
        return false;
    }

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

    removeLeadingZero(input: string): string {
        if (Number(input) > 9) {
            if (/^0+/.test(input)) {
                return input.replace(/^0+/, '');
            }
        }

        if (/^00+/.test(input)) {
            this.dateErrorMessage = `please enter valid ${name}`;
            this.showErrorMessage();
        }

        return input.replace(/^0+/, '0');
    }
    
    private showErrorMessage() {
        // Create a new errorDiv and append it to the container
        if (this.isShowError) {
            this.errorDiv = this._renderer.createElement('div');
            this._renderer.addClass(this.errorDiv, 'error-message');
            this._renderer.appendChild(this.el?.parentElement, this.errorDiv);
            if (this.errorDiv) {
                this.errorDiv.innerText = this.dateErrorMessage || 'Invalid date';
                setTimeout(() => {
                    this.removeErrorMessage();
                }, 600)
            }
        }
       
        this.dateErrorMessage = '';
    }

    private removeErrorMessage() {
        if (this.errorDiv) {
            this._renderer.removeChild(this.el?.parentElement, this.errorDiv);
            this.errorDiv = null;
        }
    }
}