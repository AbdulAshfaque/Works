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

    private el: HTMLElement;

    day = '';
    month = '';
    year = '';
    clearYear = false;
    date = '';

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

    constructor(public element: ElementRef, private renderer: Renderer2, private ngModel: NgModel) {
        this.el = this.element.nativeElement;
        this.el.style.paddingLeft = '10px';
        this.el.style.fontSize = '1rem'
        this.renderer.setProperty(this.el, 'placeholder', this.dateFormat)
    }

    ngOnInit(): void {
        if (this.ngModel?.valueChanges) {
            this.ngModel.valueChanges.subscribe((value: any) => {
                if (value) {
                    this.updateDate(value);
                }
            });
            setTimeout(() => {
                this.clearDateIfNotValid();
            }, 500)
        }
    }

    updateDate(value: string): void {
        this.renderer.setProperty(this.el, 'value', this.restrictInput(value));
    }

    restrictInput(value: string) {
        const monthDateDivider = this.findSlashPosition(value, 1);
        const DateYearDivider = this.findSlashPosition(value, 2);

        value = this.rearrangeBasedOnDateFormat(this.checkSlashPosition(value).replace(/[^0-9/]/g, ''), monthDateDivider, DateYearDivider);

        if (DateYearDivider) {
            value = this.validateYear(value, DateYearDivider);
        }
        if (this.dateFormat == 'dd/mm/yyyy') {
            this.month = !monthDateDivider ? '' : this.month;
        } else {
            this.day = !monthDateDivider ? '' : this.day;
        }
        this.year = !DateYearDivider ? '' : this.year;

        return value.substring(0, 10);
    }

    checkSlashPosition(value: string): string {
        if (value[0] == '/') {
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
            return value.slice(0, monthDateDivider);
        } else if (month === '') {
            return valueBeforeMonthDateDivider;
        } else if (Number(month) > 12 || Number(this.day) > this.getNoOfDays(month)) {
            return valueBeforeMonthDateDivider + this.month;
        }

        this.month = this.removeLeadingZero(month)
        return value.slice(0, monthStartIndex) + this.month + value.slice(monthStartIndex + month?.length);
    }

    validateDayIfBeforeMonth(value: string, monthDateDivider: number) {
        const day = !monthDateDivider ? value : value.slice(0, monthDateDivider);

        if (Number(day) > 31) {
            console.log("prev",this.day);
            return this.day;
        }
        this.day = this.removeLeadingZero(day)
        console.log("ok",this.day);
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
            return value.slice(0, monthDateDivider);
        } else if (day === '') {
            return valueBeforeMonthDateDivider;
        } else if (Number(day) > totalDays) {
            return valueBeforeMonthDateDivider + this.day;
        }

        this.day = this.removeLeadingZero(day)
        return value.slice(0, dayStartIndex) + this.day + value.slice(dayStartIndex + day?.length);
    }

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

            if ((this.month === '2' || this.month === '02')  && this.day === '29' && year.length === 4) {
                if (!this.checkIsLeapYear(year)) {
                    return value.substring(0, value.length - 1);
                }
            }
        }
    
        this.year = year;
        return value;
    }

    clearDateIfNotValid() {
        if ((!this.day || !this.month || (Number(this.year) < this.startYear) || (Number(this.year) > this.endYear))) {
            this.renderer.setProperty(this.el, 'value', '');
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
        return input.replace(/^0+/, '0');
    }
}





    // validateDayIfAfterMonths(value: string) {
    //     const position = this.findSlashPosition(value, 1);
    //     const day = position ? this.day : value;
    //     if (Number(day) > 31) {
    //         return this.day;
    //     }
    //     this.day= Number(day)? day : this.day;
    //     return value;
    // }

        // validateMonthIfBeforeDays(value: string) {
    //     const position1 = this.findSlashPosition(value, 1);
    //     const position2 = this.findSlashPosition(value, 2);
    //     if(position1) {
    //         const month = position2 ? this.month : value.slice(position1 + 1);
    //         if (Number(month) > 12) {
    //             return this.day + '/' + this.month;

    //         }
    //         this.month = month;
    //         return value;
    //     } else {
    //         return this.day;
    //     }

    // }

        // validateMonthIfBeforeDays(value: string) {
    //     const month = position2 ? this.month : value.slice(position1 + 1);
    //     if (Number(month) > 12) {
    //         return this.day + '/' + this.month;
    //     }
    //     this.month = month;
    //     return value;


    // }

            // value = this.day + this.validateMonthIfBeforeDays(value);
        // value = this.day + this.month + this.validateYear(value);

        // if (!monthDateDivider) {
        //     value = this.validateDayIfAfterMonths(value);
        // } else if (!DateYearDivider) {
        //     value = this.validateMonthIfBeforeDays(value);
        // }

        // if ((value.length > 0) && value.length < 4) {
        //     value = this.validateDayIfAfterMonths(value);
        // } else if ((value.length > 3) && (value.length < 7) && !this.findSlashPosition(value, 2)) {
        //     value = this.validateMonthIfBeforeDays(value);
        // } else {
        //     value = this.validateYear(value);
        // }



        // rearrangeBasedOnDateFormat(value: string, monthDateDivider: number, DateYearDivider: number): string {
        //     const [day, month, year] = value.split('/').map(Number);
        
        //     if (this.dateFormat === 'mm/dd/yyyy') {
        //         if (monthDateDivider) {
        //             if (month > 12) return `${this.removeLeadingZero(day)}/${this.month}/${year}`;
        //             if (DateYearDivider) {
        //                 if (day > this.getNoOfDays(month, year)) return `${this.removeLeadingZero(month)}/${this.day}/${year}`;
        //                 return `${this.removeLeadingZero(month)}/${this.removeLeadingZero(day)}/${year}`;
        //             }
        //             return `${this.removeLeadingZero(month)}/${this.removeLeadingZero(day)}/${year}`;
        //         } else {
        //             if (month > 12) return `${this.day}/${this.month}/${year}`;
        //             return `${this.day}/${this.removeLeadingZero(month)}/${year}`;
        //         }
        //     } else if (this.dateFormat === 'dd/mm/yyyy') {
        //         if (monthDateDivider) {
        //             if (month > 12) return `${this.day}/${this.removeLeadingZero(month)}/${year}`;
        //             if (DateYearDivider) {
        //                 if (day > this.getNoOfDays(month, year)) return `${this.day}/${this.removeLeadingZero(month)}/${year}`;
        //                 return `${this.removeLeadingZero(day)}/${this.removeLeadingZero(month)}/${year}`;
        //             }
        //             return `${this.removeLeadingZero(day)}/${this.removeLeadingZero(month)}/${year}`;
        //         } else {
        //             if (month > 12) return `${this.day}/${this.month}/${year}`;
        //             return `${this.removeLeadingZero(day)}/${this.month}/${year}`;
        //         }
        //     }
        
        //     // Return the original value if the dateFormat is not recognized
        //     return value;
        // }
        
        // getNoOfDays(month: number, year: number): number {
        //     // Implement logic to get the number of days in a month based on the year (considering leap years as well).
        //     // Example logic:
        //     const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
        //     if (month === 2 && ((year % 4 === 0 && year % 100 !== 0) || year % 400 === 0)) {
        //         return 29; // Leap year
        //     }
        //     return daysInMonth[month - 1];
        // }
        
        // removeLeadingZero(value: string | number): string {
        //     // Remove leading zero if present
        //     return String(value).replace(/^0+/, '');
        // }
        