import { ExtractInfo } from './extract-info';
import { TextExtractor } from './text-extractor';
import { FragmentType, TextFragment } from './text-fragment';

export class NumberTextExtractor implements TextExtractor {
    // Spaces
    private readonly _visibleSpace = ' \u00A0\u1680\u2000-\u2009\u202F\u205F\u3000';
    private readonly _invisibleSpace = '\u00AD\u180E\u200A\u200B\u2060\uFEFF';
    private readonly _space = `${this._visibleSpace}${this._invisibleSpace}`;

    private readonly _visibleSpaceRegExp = new RegExp(`[${this._visibleSpace}]`);
    private readonly _invisibleSpaceRegExp = new RegExp(`[${this._invisibleSpace}]`);
    private readonly _containsSpaceRegExp = new RegExp(`[${this._space}]`);

    // Diacritics and AThet
    private readonly _aThetRegExp = new RegExp(`^(?:[\u102B-\u103E]*([${this._space}])?)?[\u1000-\u1021]\u103A`);
    private readonly _diacriticsRegExp = new RegExp('^[\u102B-\u103E]+');

    // Digit
    private readonly _possibleDigit = '\u1040-\u1049\u101D\u104E';

    // Dash
    private readonly _dash = '\\-_';
    private readonly _dashExt = '~\u2010-\u2015\u2212\u30FC\uFF0D\u2053\u223C\uFF5E';
    private readonly _dashRegExp = new RegExp(`^[${this._dash}${this._dashExt}]`);

    // Slash
    private readonly _slash = '/';
    private readonly _slashExt = '\uFF0F';
    private readonly _slashRegExp = new RegExp(`^[${this._slash}${this._slashExt}]`);

    // Dot
    private readonly _dot = '\\.';
    private readonly _dotExt = '\u00B7\u02D9';
    private readonly _dotRegExp = new RegExp(`^[${this._dot}${this._dotExt}]`);

    // Plus
    private readonly _plus = '+\uFF0B';

    // Star
    private readonly _star = '*';

    // Hash
    private readonly _hash = '#';

    // Brackets
    private readonly _openingBracket = '(\\[\uFF08\uFF3B';
    private readonly _closingBracket = ')\\]\uFF09\uFF3D';

    // Thousand separator
    private readonly _thousandSeparator = '\u002C\u066B\u066C\u2396\u005F\u0027';
    private readonly _thousandSeparatorRegExp = new RegExp(`^[${this._thousandSeparator}]`);

    // Number group
    private readonly _decimalPointWithSpaceGroup = `(?:[${this._space}]?[${this._dot}${this._dotExt}][${this._space}]?[${this._possibleDigit}]+)`;
    private readonly _decimalPointGroup = `(?:[${this._dot}${this._dotExt}][${this._possibleDigit}]+)`;
    private readonly _decimalGroupWithSeparatorRegExp = new RegExp(`^[${this._possibleDigit}]{1,3}(?:(?:[${this._space}]?[${this._thousandSeparator}}][${this._space}]?)[${this._possibleDigit}]{2,4})+${this._decimalPointWithSpaceGroup}?`);
    private readonly _decimalGroupWithSpaceSeparatorRegExp = new RegExp(`^[${this._possibleDigit}]{1,3}(?:[${this._space}][${this._possibleDigit}]{3,3})+${this._decimalPointGroup}?`);

    private readonly _decimalGroupRegExp = new RegExp(`^[${this._possibleDigit}]+${this._decimalPointGroup}?`);

    // Number group starts with 'ဝ' / '၎'
    private readonly _possibleDigitGroupStartsWithU101DOrU104ERegExp = new RegExp(`^[\u101D\u104E][${this._possibleDigit}]*[${this._thousandSeparator}${this._dot}${this._dotExt}]?[${this._possibleDigit}]*[\u1040-\u1049]`);

    // Number with hsettha (ဆယ်သား)
    private readonly _hsethaRegExp = new RegExp(`^[(\uFF08][${this._space}]?[\u1041-\u1049\u104E][${this._space}]?[)\uFF09][${this._space}]?\u1040\u102D`);

    // Number with brackets
    private readonly _numberBracketsRegExp = new RegExp(`^[${this._openingBracket}][${this._space}]?[\u101D\u1040-\u1049\u104E]+[${this._space}]?[${this._closingBracket}]`);

    // Date
    private readonly _dtSeparator = `${this._dash}${this._slash}${this._dot}\u104A${this._dashExt}${this._slashExt}${this._dotExt}`;
    private readonly _dtYear2DigitsGroup = `(?:[\u1041\u1042][${this._possibleDigit}])`;
    private readonly _dtYearGroup = `(?:[\u1041-\u1049][${this._possibleDigit}]{3,3})`;
    private readonly _dtMonthGroup = '(?:\u1041[\u1040-\u1042\u101D]|[\u1040\u101D][\u1041-\u1049\u104E]|[\u1041-\u1049\u104E])';
    private readonly _dtDayGroup = `(?:[\u1041-\u1042][${this._possibleDigit}]|\u1043[\u1040-\u1041\u101D]|[\u1040\u101D][\u1041-\u1049\u104E]|[\u1041-\u1049\u104E])`;
    private readonly _dtDateNotFollowedByGroup = `(?![${this._dtSeparator}]?[\u1040-\u1049])`;

    private readonly _dtDateQuickRegExp = new RegExp(`^(?:[${this._possibleDigit}]{1,4})[${this._dtSeparator}${this._space}]{0,3}(?:[${this._possibleDigit}]{1,2})[${this._dtSeparator}${this._space}]{0,3}(?:[${this._possibleDigit}]{1,4})${this._dtDateNotFollowedByGroup}`);
    private readonly _dtDMYRegExp = new RegExp(`^${this._dtDayGroup}[${this._dtSeparator}${this._space}]{1,3}${this._dtMonthGroup}[${this._dtSeparator}${this._space}]{1,3}${this._dtYearGroup}${this._dtDateNotFollowedByGroup}`);
    private readonly _dtDMYWith2DigitYearRegExp = new RegExp(`^${this._dtDayGroup}[${this._dtSeparator}${this._space}]{1,3}${this._dtMonthGroup}[${this._dtSeparator}${this._space}]{1,3}${this._dtYear2DigitsGroup}${this._dtDateNotFollowedByGroup}`);
    private readonly _dtYMDRegExp = new RegExp(`^${this._dtYearGroup}[${this._dtSeparator}${this._space}]{1,3}${this._dtMonthGroup}[${this._dtSeparator}${this._space}]{1,3}${this._dtDayGroup}${this._dtDateNotFollowedByGroup}`);
    private readonly _dtMDYRegExp = new RegExp(`^${this._dtMonthGroup}[${this._dtSeparator}${this._space}]{1,3}${this._dtDayGroup}[${this._dtSeparator}${this._space}]{1,3}${this._dtYearGroup}${this._dtDateNotFollowedByGroup}`);
    private readonly _dtMDYWith2DigitYearRegExp = new RegExp(`^${this._dtMonthGroup}[${this._dtSeparator}${this._space}]{1,3}${this._dtDayGroup}[${this._dtSeparator}${this._space}]{1,3}${this._dtYear2DigitsGroup}${this._dtDateNotFollowedByGroup}`);
    private readonly _dtYMDIsoRegExp = new RegExp(`^(?:[\u1041\u1042][${this._possibleDigit}]{3,3})(?:[\u1040\u101D][\u1041-\u1049\u104E]|\u1041[\u1040-\u1042\u101D])(?:[\u1040\u101D][\u1041-\u1049\u104E]|[\u1041-\u1042][${this._possibleDigit}]|\u1043[\u1040-\u1041\u101D])${this._dtDateNotFollowedByGroup}`);

    // Time
    private readonly _dtHourGroup = `(?:[\u1040\u1041\u101D][${this._possibleDigit}]|\u1042[\u1040-\u1043\u101D]|[\u1041-\u1049\u104E])`;
    private readonly _dtMinuteSecondGroup = `(?:[\u1040-\u1045\u101D\u104E][${this._possibleDigit}]|[\u1041-\u1049\u104E])`;
    private readonly _dtTimeSeparatorGroup = `[${this._space}]?[:;\u1038][${this._space}]?`;
    private readonly _dtTimeNotFollowedByGroup = `(?!(?:${this._dtTimeSeparatorGroup})?[\u1040-\u1049])`;

    private readonly _dtTimeRegExp = new RegExp(`^${this._dtHourGroup}(?:${this._dtTimeSeparatorGroup}${this._dtMinuteSecondGroup}){1,2}(?:\.[\u1040-\u1049]{7,7})?(?:(?:Z)|(?:[+\\-][\u1040-\u1042][\u1040-\u1049]:?[\u1040-\u1045][\u1040-\u1049]{0,4}))?${this._dtTimeNotFollowedByGroup}`);

    // Phone Number
    private readonly _phSeparator = `${this._dash}${this._slash}${this._dot}${this._openingBracket}\u104A${this._dashExt}${this._slashExt}${this._dotExt}\uFF0E`;
    private readonly _phRegExp = new RegExp(`^[${this._plus}]?(?:[${this._phSeparator}${this._space}${this._star}]*[${this._possibleDigit}][${this._space}${this._closingBracket}]*){3,}${this._hash}?`);

    // Domain Name
    private readonly _possibleDomainNameSuffixRegExp = /^[\S]+\.[a-zA-Z]{2,63}/;

    extractNext(input: string, firstCp: number): TextFragment | null {
        if (input.length < 2) {
            return null;
        }

        const isStartsWithNumber = firstCp >= 0x1040 && firstCp <= 0x1049;
        const isStartsWithPossibleNumber = !isStartsWithNumber && (firstCp === 0x101D || firstCp === 0x104E);

        if (isStartsWithNumber || isStartsWithPossibleNumber) {
            if (input.length > 5) {
                const dateFragment = this.getDateFragment(input);
                if (dateFragment != null) {
                    return dateFragment;
                }
            }

            if (input.length > 2) {
                const timeFragment = this.getTimeFragment(input);
                if (timeFragment != null) {
                    return timeFragment;
                }

                const phoneNumberFragment = this.getPhoneNumberFragment(input);
                if (phoneNumberFragment != null) {
                    return phoneNumberFragment;
                }
            }

            return this.getDecimalFragment(input);
        }

        // င (အင်္ဂါ / တင်း / တောင်း)
        if (input.length > 3 && firstCp === 0x1004) {
            const ingaTinOrTaungAncientNumberFragment = this.getIngaTinOrTaungAncientNumberFragment(input, firstCp);
            if (ingaTinOrTaungAncientNumberFragment != null) {
                return ingaTinOrTaungAncientNumberFragment;
            }
        }

        // * + ＋
        if (input.length > 3 && (firstCp === 0x002A || firstCp === 0x002B || firstCp === 0xFF0B)) {
            const phoneNumberFragment = this.getPhoneNumberFragment(input);
            if (phoneNumberFragment != null) {
                return phoneNumberFragment;
            }
        }

        // ( [ （ ［
        if (input.length > 2 && (firstCp === 0x0028 || firstCp === 0x005B || firstCp === 0xFF08 || firstCp === 0xFF3B)) {
            const openingBracketsNumberFragment = this.getOpeningBracketsNumberFragment(input, firstCp);
            if (openingBracketsNumberFragment != null) {
                return openingBracketsNumberFragment;
            }
        }

        return null;
    }

    private getDateFragment(input: string): TextFragment | null {
        if (!this._dtDateQuickRegExp.test(input)) {
            return null;
        }

        let monthStart = false;
        let m = input.match(this._dtDMYRegExp);
        if (m == null) {
            m = input.match(this._dtYMDRegExp);
        }

        if (m == null) {
            m = input.match(this._dtMDYRegExp);
            if (m != null) {
                monthStart = true;
            }
        }

        if (m == null && input.length > 7) {
            m = input.match(this._dtYMDIsoRegExp);
        }

        if (m == null) {
            m = input.match(this._dtDMYWith2DigitYearRegExp);
        }

        if (m == null) {
            m = input.match(this._dtMDYWith2DigitYearRegExp);
            if (m != null) {
                monthStart = true;
            }
        }

        if (m == null) {
            return null;
        }

        const matchedStr = m[0];

        const extractInfo = this.getDateExtractInfo(matchedStr, monthStart);
        if (extractInfo == null) {
            return null;
        }

        const rightStr = input.substring(extractInfo.matchedStr.length);
        if (rightStr && !this.checkRightStrSafeForDateAndPhoneNumber(rightStr, extractInfo)) {
            return null;
        }

        return {
            ...extractInfo,
            fragmentType: FragmentType.Number,
            possibleDate: true
        };
    }

    private getTimeFragment(input: string): TextFragment | null {
        const m = input.match(this._dtTimeRegExp);

        if (m == null) {
            return null;
        }

        const matchedStr = m[0];
        let extractInfo = this.getTimeExtractInfo(matchedStr);
        if (extractInfo == null) {
            return null;
        }

        const rightStr = input.substring(extractInfo.matchedStr.length);
        if (rightStr.length > 0) {
            if (this.checkRightStrForPossibleDigit(rightStr)) {
                return null;
            }

            if (rightStr[0] === ':' || rightStr[0] === '\u1038' || rightStr[0] === '_') {
                const rightStr2 = rightStr.substring(1);
                if (this.checkRightStrForPossibleDigit(rightStr2)) {
                    return null;
                }
            } else if (this._diacriticsRegExp.test(rightStr) || this._aThetRegExp.test(rightStr)) {
                if (extractInfo.normalizedStr.split(':').length > 2 &&
                    extractInfo.matchedStr[extractInfo.matchedStr.length - 2] !== ':') {
                    const lastMatchedCp = extractInfo.matchedStr.codePointAt(extractInfo.matchedStr.length - 1);
                    if (lastMatchedCp && lastMatchedCp >= 0x1040 && lastMatchedCp <= 0x1049) {
                        return null;
                    }

                    const secondLastMatchedCp = extractInfo.matchedStr.codePointAt(extractInfo.matchedStr.length - 2);
                    if (secondLastMatchedCp && (secondLastMatchedCp === 0x101D || secondLastMatchedCp === 0x104E)) {
                        return null;
                    }

                    const newStr = extractInfo.matchedStr.substring(0, extractInfo.matchedStr.length - 1);
                    const newMatch = newStr.match(this._dtTimeRegExp);

                    if (newMatch == null) {
                        return null;
                    }

                    const newExtractInfo = this.getTimeExtractInfo(newMatch[0]);
                    if (newExtractInfo == null) {
                        return null;
                    }

                    extractInfo = newExtractInfo;
                } else {
                    return null;
                }
            }
        }

        return {
            ...extractInfo,
            fragmentType: FragmentType.Number,
            possibleTime: true
        };
    }

    private getPhoneNumberFragment(input: string): TextFragment | null {
        const m = input.match(this._phRegExp);
        if (m == null) {
            return null;
        }

        const matchedStr = m[0];

        const extractInfo = this.getPhoneNumberExtractInfo(matchedStr);
        if (extractInfo == null) {
            return null;
        }

        const rightStr = input.substring(extractInfo.matchedStr.length);
        if (rightStr && !this.checkRightStrSafeForDateAndPhoneNumber(rightStr, extractInfo)) {
            return null;
        }

        return {
            ...extractInfo,
            fragmentType: FragmentType.Number
        };
    }

    private getOpeningBracketsNumberFragment(input: string, firstCp: number): TextFragment | null {
        if (input.length > 4 && (firstCp === 0x0028 || firstCp === 0xFF08)) {
            const hsethaFragment = this.getNumberHsethaFragment(input);
            if (hsethaFragment != null) {
                return hsethaFragment;
            }
        }

        if (input.length > 4) {
            const phoneNumberFragment = this.getPhoneNumberFragment(input);
            if (phoneNumberFragment != null) {
                return phoneNumberFragment;
            }
        }

        const m = input.match(this._numberBracketsRegExp);

        if (m == null) {
            return null;
        }

        const matchedStr = m[0];

        const extractInfo = this.getBracketsNumberExtractInfo(matchedStr);
        if (extractInfo == null) {
            return null;
        }

        return {
            ...extractInfo,
            fragmentType: FragmentType.Number,
            decimal: true
        };
    }

    private getIngaTinOrTaungAncientNumberFragment(input: string, firstCp: number): TextFragment | null {
        const ingaFragment = this.getNumberIngaFragment(input, firstCp);
        if (ingaFragment != null) {
            return ingaFragment;
        }

        return this.getNumberTinOrTaungFragment(input, firstCp);
    }

    private getNumberIngaFragment(input: string, firstCp: number): TextFragment | null {
        if (firstCp !== 0x1004 || input.length < 5) {
            return null;
        }

        if (input[1] !== '\u103A' || input[2] !== '\u1039' || input[4] !== '\u102B') {
            return null;
        }

        const c4 = input[3];
        const c4Cp = c4.codePointAt(0);
        if (!c4Cp || !(c4Cp >= 0x1040 && c4Cp <= 0x1049)) {
            return null;
        }

        let matchedStr = input.substring(0, 4);
        let normalizedStr = matchedStr;

        matchedStr += input[4];
        normalizedStr += input[4];

        const rightStr = input.substring(matchedStr.length);

        if (rightStr && (this._aThetRegExp.test(rightStr) || this._diacriticsRegExp.test(rightStr))) {
            return null;
        }

        return {
            fragmentType: FragmentType.Number,
            matchedStr,
            normalizedStr,
            decimalStr: c4,
            decimal: true,
            ancientWrittenForm: true,
            // အင်္ဂါ
            ancientMeasureWords: ['\u1021\u1004\u103A\u1039\u1002\u102B']
        };
    }

    private getNumberTinOrTaungFragment(input: string, firstCp: number): TextFragment | null {
        if (firstCp !== 0x1004 || input.length < 4) {
            return null;
        }

        if (input[1] !== '\u103A' || input[2] !== '\u1039') {
            return null;
        }

        const c4 = input[3];
        const c4Cp = c4.codePointAt(0);
        if (!c4Cp || !(c4Cp >= 0x1040 && c4Cp <= 0x1049)) {
            return null;
        }

        const matchedStr = input.substring(0, 4);

        const rightStr = input.substring(matchedStr.length);
        if (rightStr && (this._aThetRegExp.test(rightStr) || this._diacriticsRegExp.test(rightStr))) {
            return null;
        }

        const ancientMeasureWords = [
            '\u1010\u1031\u102C\u1004\u103A\u1038',
            '\u1010\u1004\u103A\u1038'
        ];

        return {
            fragmentType: FragmentType.Number,
            matchedStr,
            normalizedStr: matchedStr,
            decimal: true,
            ancientWrittenForm: true,
            decimalStr: c4,
            // အင်္ဂါ
            ancientMeasureWords
        };
    }

    private getNumberHsethaFragment(input: string): TextFragment | null {
        const m = input.match(this._hsethaRegExp);
        if (m == null) {
            return null;
        }

        const matchedStr = m[0];

        const rightStr = input.substring(matchedStr.length);
        if (rightStr && (this._aThetRegExp.test(rightStr) || this._diacriticsRegExp.test(rightStr))) {
            return null;
        }

        const extractInfo = this.getBracketsNumberExtractInfo(matchedStr);
        if (extractInfo == null) {
            return null;
        }

        return {
            ...extractInfo,
            fragmentType: FragmentType.Number,
            decimal: true,
            ancientWrittenForm: true,
            // ဆယ်သား
            ancientMeasureWords: ['\u1006\u101A\u103A\u101E\u102C\u1038']
        };
    }

    private getDecimalFragment(input: string): TextFragment | null {
        const m = this.matchDecimalGroup(input);
        if (m == null) {
            return null;
        }

        const matchedStr = m[0];

        const extractInfo = this.getDecimalExtractInfo(matchedStr);
        if (extractInfo == null) {
            return null;
        }

        const numberFragment: TextFragment = {
            ...extractInfo,
            fragmentType: FragmentType.Number,
            decimal: true
        };

        if (this.mergeAncientNumeralShortcutSuffixFragment(input, numberFragment)) {
            return numberFragment;
        } else {
            const rightStr = input.substring(numberFragment.matchedStr.length);
            if (rightStr && (this._aThetRegExp.test(rightStr) || this._diacriticsRegExp.test(rightStr))) {
                const newMatchedStr = numberFragment.matchedStr.substring(0, numberFragment.matchedStr.length - 1);
                if (newMatchedStr.length === 1) {
                    const cp = newMatchedStr.codePointAt(0) as number;
                    if (cp >= 0x1040 && cp <= 0x1049) {
                        return {
                            fragmentType: FragmentType.Number,
                            matchedStr: newMatchedStr,
                            normalizedStr: newMatchedStr,
                            decimalStr: newMatchedStr,
                            decimal: true
                        };
                    } else {
                        return null;
                    }
                }

                const m2 = this.matchDecimalGroup(newMatchedStr);

                if (m2 == null) {
                    return null;
                }

                const m2Str = m2[0];
                const newExtractInfo = this.getDecimalExtractInfo(m2Str);
                if (newExtractInfo == null) {
                    return null;
                }

                return {
                    ...newExtractInfo,
                    fragmentType: FragmentType.Number,
                    decimal: true
                };


            }

            return numberFragment;
        }
    }

    // tslint:disable-next-line: max-func-body-length
    private mergeAncientNumeralShortcutSuffixFragment(input: string, numberFragment: TextFragment): boolean {
        const rightStr = input.substring(numberFragment.matchedStr.length);
        if (!rightStr) {
            return false;
        }

        const right1stCp = rightStr.codePointAt(0);
        if (!right1stCp) {
            return false;
        }

        const ingaTinOrTaungAncientNumberFragment = this.getIngaTinOrTaungAncientNumberFragment(rightStr, right1stCp);
        if (ingaTinOrTaungAncientNumberFragment != null) {
            numberFragment.matchedStr += ingaTinOrTaungAncientNumberFragment.matchedStr;
            numberFragment.normalizedStr += ingaTinOrTaungAncientNumberFragment.normalizedStr;
            numberFragment.decimalStr += ingaTinOrTaungAncientNumberFragment.decimalStr as string;
            numberFragment.ancientWrittenForm = true;
            numberFragment.ancientMeasureWords = ingaTinOrTaungAncientNumberFragment.ancientMeasureWords;

            return true;
        }

        let diacriticsOrAThetMatch = rightStr.match(this._aThetRegExp);
        if (diacriticsOrAThetMatch == null) {
            diacriticsOrAThetMatch = rightStr.match(this._diacriticsRegExp);
        }

        if (diacriticsOrAThetMatch == null) {
            return false;
        }

        const diacriticsOrAThetMatchedStr = diacriticsOrAThetMatch[0];
        const spaceIncluded = diacriticsOrAThetMatch[1] ? true : false;
        const diacriticsOrAThetNormalizedStr = spaceIncluded ?
            diacriticsOrAThetMatchedStr.replace(this._containsSpaceRegExp, '') : diacriticsOrAThetMatchedStr;

        let ancientMeasureWords: string[] | undefined;

        if (diacriticsOrAThetNormalizedStr === '\u103D\u1031\u1038' || diacriticsOrAThetNormalizedStr === '\u103D\u1031') {
            // ရွေး
            ancientMeasureWords = ['\u101B\u103D\u1031\u1038'];
        } else if (diacriticsOrAThetNormalizedStr === '\u102D') {
            // ကျပ် / စိတ် / မိုက်
            ancientMeasureWords = [
                '\u1000\u103B\u1015\u103A',
                '\u1005\u102D\u1010\u103A',
                '\u1019\u102D\u102F\u1000\u103A'
            ];
        } else if (diacriticsOrAThetNormalizedStr === '\u103D\u102C') {
            // ထွာ
            ancientMeasureWords = ['\u1011\u103D\u102C'];
        } else if (diacriticsOrAThetNormalizedStr === '\u1032') {
            // ပဲ / စလယ် / ပယ်
            ancientMeasureWords = [
                '\u1015\u1032',
                '\u1005\u101C\u101A\u103A',
                '\u1015\u101A\u103A'
            ];
        } else if (diacriticsOrAThetNormalizedStr === '\u1030\u1038' || diacriticsOrAThetNormalizedStr === '\u1030') {
            // မူး
            ancientMeasureWords = ['\u1019\u1030\u1038'];
        } else if (diacriticsOrAThetNormalizedStr === '\u1036') {
            // လက်သစ် / မတ်
            ancientMeasureWords = [
                '\u101C\u1000\u103A\u101E\u1005\u103A',
                '\u1019\u1010\u103A'
            ];
        } else if (diacriticsOrAThetNormalizedStr === '\u103B\u1000\u103A') {
            // လမျက်
            ancientMeasureWords = ['\u101C\u1019\u103B\u1000\u103A'];
        } else if (diacriticsOrAThetNormalizedStr === '\u101A\u103A') {
            // လမယ်
            ancientMeasureWords = ['\u101C\u1019\u101A\u103A'];
        } else if (diacriticsOrAThetNormalizedStr === '\u103D\u1000\u103A') {
            // ခွက်
            ancientMeasureWords = ['\u1001\u103D\u1000\u103A'];
        } else if (diacriticsOrAThetNormalizedStr === '\u103A') {
            // ပြည်
            ancientMeasureWords = ['\u1015\u103C\u100A\u103A'];
        } else if (diacriticsOrAThetNormalizedStr === '\u103D\u1032') {
            // ခွဲ
            ancientMeasureWords = ['\u1001\u103D\u1032'];
        } else if (diacriticsOrAThetNormalizedStr === '\u102B') {
            // ပိဿာ
            ancientMeasureWords = ['\u1015\u102D\u103F\u102C'];
        } else if (diacriticsOrAThetNormalizedStr === '\u102B\u1038') {
            // ပြား / ပါး
            ancientMeasureWords = [
                '\u1015\u103C\u102C\u1038',
                '\u1015\u102B\u1038'
            ];
        }

        if (!ancientMeasureWords || !ancientMeasureWords.length) {
            return false;
        }

        const lastC = numberFragment.matchedStr[numberFragment.matchedStr.length - 1];
        if ((lastC === '\u101D' || lastC === '\u104E') && rightStr.length > diacriticsOrAThetMatchedStr.length) {
            const nextRightCp = rightStr.codePointAt(diacriticsOrAThetMatchedStr.length);
            if (nextRightCp && ((nextRightCp >= 0x1000 && nextRightCp <= 0x1049) ||
                (nextRightCp >= 0x104C && nextRightCp <= 0x104F) ||
                (nextRightCp >= 0xAA60 && nextRightCp <= 0xAA7F) ||
                (nextRightCp >= 0xA9E0 && nextRightCp <= 0xA9FE))) {
                return false;
            }
        }

        numberFragment.matchedStr += diacriticsOrAThetMatchedStr;
        numberFragment.normalizedStr += diacriticsOrAThetNormalizedStr;
        numberFragment.ancientWrittenForm = true;
        numberFragment.ancientMeasureWords = ancientMeasureWords;

        if (spaceIncluded) {
            numberFragment.spaceIncluded = true;
            numberFragment.normalizeReason = numberFragment.normalizeReason || {};
            numberFragment.normalizeReason.removeSpace = true;
        }

        return true;
    }

    // tslint:disable-next-line: max-func-body-length
    private getDateExtractInfo(matchedStr: string, monthStart?: boolean): ExtractInfo | null {
        const extractInfo: ExtractInfo = {
            matchedStr,
            normalizedStr: ''
        };

        let prevIsDigit = false;
        let prevIsSpace = false;
        let prevIsSeparator = false;
        let dateSeparator: string | undefined;

        for (const c of matchedStr) {
            const cp = c.codePointAt(0) as number;

            if (cp >= 0x1040 && cp <= 0x1049) {
                extractInfo.normalizedStr += c;
                prevIsDigit = true;
                prevIsSpace = false;
                prevIsSeparator = false;
            } else if (cp === 0x101D || cp === 0x104E) {
                extractInfo.normalizeReason = extractInfo.normalizeReason || {};

                if (cp === 0x101D) {
                    extractInfo.normalizedStr += '\u1040';
                    extractInfo.normalizeReason.changeU101DToU1040 = true;
                } else {
                    extractInfo.normalizedStr += '\u1044';
                    extractInfo.normalizeReason.changeU104EToU1044 = true;
                }

                prevIsDigit = true;
                prevIsSpace = false;
                prevIsSeparator = false;
            } else if (this._containsSpaceRegExp.test(c)) {
                if (prevIsSpace) {
                    return null;
                }

                extractInfo.spaceIncluded = true;

                if (prevIsSeparator) {
                    extractInfo.normalizeReason = extractInfo.normalizeReason || {};
                    extractInfo.normalizeReason.removeSpace = true;
                } else {
                    extractInfo.normalizedStr += ' ';

                    if (cp !== 0x0020) {
                        extractInfo.normalizeReason = extractInfo.normalizeReason || {};
                        extractInfo.normalizeReason.normalizeSpace = true;
                    }
                }

                prevIsDigit = false;
                prevIsSpace = true;
                prevIsSeparator = false;
            } else {
                if (prevIsSeparator || (!prevIsDigit && !prevIsSpace) || (dateSeparator && c !== dateSeparator)) {
                    return null;
                }

                if (prevIsSpace) {
                    extractInfo.normalizedStr = extractInfo.normalizedStr.trimRight();
                    extractInfo.normalizeReason = extractInfo.normalizeReason || {};
                    extractInfo.normalizeReason.removeSpace = true;
                }

                extractInfo.normalizedStr += c;
                prevIsDigit = false;
                prevIsSpace = false;
                dateSeparator = c;
                prevIsSeparator = true;
            }
        }

        if (dateSeparator) {
            extractInfo.dateSeparator = dateSeparator;
        } else if (extractInfo.spaceIncluded) {
            extractInfo.dateSeparator = ' ';
        }

        if (extractInfo.dateSeparator != null) {
            extractInfo.separatorIncluded = true;

            const dParts = extractInfo.normalizedStr.split(extractInfo.dateSeparator);
            if (dParts.length !== 3) {
                return null;
            }

            if (dParts[0].length === 4) {
                if (dParts[1].length === 2 && dParts[2].length === 2) {
                    extractInfo.dateFormat = `yyyy${extractInfo.dateSeparator}MM${extractInfo.dateSeparator}dd`;
                } else {
                    extractInfo.dateFormat = `yyyy${extractInfo.dateSeparator}M${extractInfo.dateSeparator}d`;
                }
            } else if (dParts[2].length === 4) {
                if (dParts[0].length === 2 && dParts[1].length === 2) {
                    extractInfo.dateFormat = monthStart ?
                        `MM${extractInfo.dateSeparator}dd${extractInfo.dateSeparator}yyyy` : `dd${extractInfo.dateSeparator}MM${extractInfo.dateSeparator}yyyy`;
                } else {
                    extractInfo.dateFormat = monthStart ?
                        `M${extractInfo.dateSeparator}d${extractInfo.dateSeparator}yyyy` : `d${extractInfo.dateSeparator}M${extractInfo.dateSeparator}yyyy`;
                }
            } else {
                if (dParts[0].length === 2 && dParts[1].length === 2) {
                    extractInfo.dateFormat = monthStart ?
                        `MM${extractInfo.dateSeparator}dd${extractInfo.dateSeparator}yy` : `dd${extractInfo.dateSeparator}MM${extractInfo.dateSeparator}yy`;
                } else {
                    extractInfo.dateFormat = monthStart ?
                        `M${extractInfo.dateSeparator}d${extractInfo.dateSeparator}yy` : `d${extractInfo.dateSeparator}M${extractInfo.dateSeparator}yy`;
                }
            }
        } else {
            extractInfo.dateFormat = 'yyyyMMdd';

            extractInfo.decimal = true;
            extractInfo.decimalStr = extractInfo.normalizedStr;

            extractInfo.possiblePhoneNumber = true;
            extractInfo.phoneNumberStr = extractInfo.normalizedStr;
        }

        return extractInfo;
    }

    private getTimeExtractInfo(matchedStr: string): ExtractInfo | null {
        const extractInfo: ExtractInfo = {
            matchedStr,
            normalizedStr: ''
        };

        let digitCount = 0;
        let colonSeparatorCount = 0;

        for (const c of matchedStr) {
            const cp = c.codePointAt(0) as number;

            if (cp >= 0x1040 && cp <= 0x1049) {
                ++digitCount;
                extractInfo.normalizedStr += c;
            } else if (cp === 0x101D || cp === 0x104E) {
                extractInfo.normalizeReason = extractInfo.normalizeReason || {};

                if (cp === 0x101D) {
                    extractInfo.normalizedStr += '\u1040';
                    extractInfo.normalizeReason.changeU101DToU1040 = true;
                } else {
                    extractInfo.normalizedStr += '\u1044';
                    extractInfo.normalizeReason.changeU104EToU1044 = true;
                }
            } else if (this._containsSpaceRegExp.test(c)) {
                extractInfo.spaceIncluded = true;
                extractInfo.normalizeReason = extractInfo.normalizeReason || {};
                extractInfo.normalizeReason.removeSpace = true;
            } else if (cp === 0x003A || cp === 0x1038 || cp === 0x003B) {
                extractInfo.normalizedStr += ':';
                if (cp === 0x003A) {
                    ++colonSeparatorCount;
                } else {
                    extractInfo.normalizeReason = extractInfo.normalizeReason || {};
                    extractInfo.normalizeReason.normalizeColon = true;

                    if (cp === 0x1038) {
                        ++colonSeparatorCount;
                    }
                }
            } else {
                extractInfo.normalizedStr += c;
            }
        }

        if (!digitCount || !colonSeparatorCount) {
            return null;
        }

        extractInfo.separatorIncluded = true;

        return extractInfo;
    }

    // tslint:disable-next-line: max-func-body-length
    private getPhoneNumberExtractInfo(matchedStr: string): ExtractInfo | null {
        const extractInfo: ExtractInfo = {
            matchedStr,
            normalizedStr: '',
            phoneNumberStr: '',
            possiblePhoneNumber: true
        };

        let possibleDecimal = true;
        let curStr = matchedStr;
        let startOfString = true;
        let prevIsDigit = false;
        let prevIsSpace = false;
        let digitCount = 0;
        let possibleDigitCount = 0;
        let maxDigitCountSplittedBySeparator = 0;
        let dotCount = 0;
        let slashCount = 0;

        if (curStr[0] === '+' || curStr[0] === '\uFF0B') {
            extractInfo.normalizedStr += '+';
            extractInfo.phoneNumberStr += '+';

            if (curStr[0] !== '+') {
                extractInfo.normalizeReason = extractInfo.normalizeReason || {};
                extractInfo.normalizeReason.normalizePlusSign = true;
            }

            curStr = curStr.substring(1);

            startOfString = false;
            possibleDecimal = false;
        }

        for (let i = 0; i < curStr.length; i++) {
            const c = curStr[i];
            const cp = c.codePointAt(0) as number;

            if ((cp >= 0x1040 && cp <= 0x1049) || cp === 0x101D || cp === 0x104E) {
                let decimalStr = '';
                ++possibleDigitCount;
                if (!prevIsDigit) {
                    maxDigitCountSplittedBySeparator = 0;
                }
                ++maxDigitCountSplittedBySeparator;

                if (cp >= 0x1040 && cp <= 0x1049) {
                    ++digitCount;
                    decimalStr = c;
                } else {
                    extractInfo.normalizeReason = extractInfo.normalizeReason || {};
                    if (cp === 0x101D) {
                        decimalStr = '\u1040';
                        extractInfo.normalizeReason.changeU101DToU1040 = true;
                    } else {
                        decimalStr = '\u1044';
                        extractInfo.normalizeReason.changeU104EToU1044 = true;
                    }
                }

                extractInfo.normalizedStr += decimalStr;
                extractInfo.phoneNumberStr += decimalStr;
                prevIsDigit = true;
                prevIsSpace = false;
            } else if (cp === 0x002A) {
                if (!prevIsDigit && !startOfString) {
                    return null;
                }

                extractInfo.normalizedStr += c;
                extractInfo.phoneNumberStr += c;
                prevIsDigit = false;
                prevIsSpace = false;
                possibleDecimal = false;
            } else if (cp === 0x0023) {
                extractInfo.normalizedStr += c;
                extractInfo.phoneNumberStr += c;
                possibleDecimal = false;
                break;
            } else if (cp === 0x0028 || cp === 0x005B || cp === 0xFF08 || cp === 0xFF3B) {
                if (!this.hasCorrectClosingBracket(cp, curStr.substring(i + 1))) {
                    return null;
                }

                extractInfo.normalizedStr += c;
                extractInfo.separatorIncluded = true;
                prevIsDigit = false;
                prevIsSpace = false;
                possibleDecimal = false;
            } else if (this._containsSpaceRegExp.test(c)) {
                if (prevIsSpace) {
                    return null;
                }

                extractInfo.spaceIncluded = true;
                if (this._visibleSpaceRegExp.test(c)) {
                    extractInfo.normalizedStr += ' ';
                    if (c !== ' ') {
                        extractInfo.normalizeReason = extractInfo.normalizeReason || {};
                        extractInfo.normalizeReason.normalizeSpace = true;
                    }
                    extractInfo.separatorIncluded = true;
                } else {
                    extractInfo.normalizeReason = extractInfo.normalizeReason || {};
                    extractInfo.normalizeReason.removeSpace = true;
                }

                prevIsDigit = false;
                prevIsSpace = true;
            } else {
                if (!prevIsDigit && !prevIsSpace && !startOfString) {
                    return null;
                }

                if (cp === 0x002E || cp === 0x00B7 || cp === 0x02D9) {
                    ++dotCount;
                    if (dotCount > 1) {
                        possibleDecimal = false;
                    }

                    extractInfo.normalizedStr += '.';
                    if (c !== '.') {
                        extractInfo.normalizeReason = extractInfo.normalizeReason || {};
                        extractInfo.normalizeReason.normalizeDecimalPoint = true;
                    }
                } else {
                    if (cp === 0x002F) {
                        ++slashCount;
                        possibleDecimal = false;
                    }

                    extractInfo.normalizedStr += c;
                }

                prevIsDigit = false;
                prevIsSpace = false;
                extractInfo.separatorIncluded = true;
            }

            startOfString = false;
        }

        if (!digitCount || possibleDigitCount < 3 || maxDigitCountSplittedBySeparator < 2) {
            return null;
        }

        if (extractInfo.normalizedStr[0] === '+' && possibleDigitCount < 6) {
            return null;
        }

        if (extractInfo.normalizedStr[0] === '\u1040' && extractInfo.normalizedStr[1] === '\u1040' && possibleDigitCount < 8) {
            return null;
        }


        if ((extractInfo.spaceIncluded || extractInfo.separatorIncluded) &&
            extractInfo.phoneNumberStr && extractInfo.phoneNumberStr.length < 5) {
            return null;
        }

        if (extractInfo.normalizedStr[0] === '*' && extractInfo.normalizedStr[extractInfo.normalizedStr.length - 1] !== '#') {
            return null;
        }

        if ((dotCount === 1 || slashCount === 1) && extractInfo.normalizedStr[0] !== '+' && extractInfo.normalizedStr[0] !== '\u1040' &&
            extractInfo.phoneNumberStr && extractInfo.normalizedStr.length === extractInfo.phoneNumberStr.length + 1) {
            return null;
        }

        if (extractInfo.normalizedStr[0] === '\u1040') {
            possibleDecimal = false;
        }

        if (!possibleDecimal) {
            return extractInfo;
        }

        const m = this.matchDecimalGroup(extractInfo.normalizedStr);
        if (m == null) {
            return extractInfo;
        }

        const decimalMatchedStr = m[0];

        if (decimalMatchedStr.length === extractInfo.normalizedStr.length) {
            const decimalExtractInfo = this.getDecimalExtractInfo(decimalMatchedStr);
            if (decimalExtractInfo == null) {
                return extractInfo;
            }

            extractInfo.decimal = true;
            extractInfo.decimalStr = decimalExtractInfo.decimalStr;
            if (decimalExtractInfo.thousandSeparator) {
                extractInfo.thousandSeparator = decimalExtractInfo.thousandSeparator;
            }
        }

        return extractInfo;
    }

    // tslint:disable-next-line: max-func-body-length
    private getDecimalExtractInfo(matchedStr: string): ExtractInfo | null {
        const extractInfo: ExtractInfo = {
            matchedStr: '',
            normalizedStr: '',
            decimalStr: ''
        };

        let digitCount = 0;
        let tmpSpace = '';
        let prevIsSeparator = false;
        let thousandSeparator = '';
        let hasMultiSeparator = false;
        let hasPendingSpace = false;

        for (const c of matchedStr) {
            const cp = c.codePointAt(0) as number;

            if ((cp >= 0x1040 && cp <= 0x1049) || cp === 0x101D || cp === 0x104E) {
                let digitStr = '';

                if (cp >= 0x1040 && cp <= 0x1049) {
                    ++digitCount;
                    digitStr = c;
                } else {
                    extractInfo.normalizeReason = extractInfo.normalizeReason || {};
                    if (cp === 0x101D) {
                        digitStr = '\u1040';
                        extractInfo.normalizeReason.changeU101DToU1040 = true;
                    } else {
                        digitStr = '\u1044';
                        extractInfo.normalizeReason.changeU104EToU1044 = true;
                    }
                }

                extractInfo.decimalStr += digitStr;

                if (tmpSpace) {
                    extractInfo.spaceIncluded = true;
                    extractInfo.separatorIncluded = true;

                    extractInfo.normalizedStr += ' ' + digitStr;

                    if (tmpSpace !== ' ') {
                        extractInfo.normalizeReason = extractInfo.normalizeReason || {};
                        extractInfo.normalizeReason.normalizeSpace = true;
                    }

                    tmpSpace = '';
                    hasPendingSpace = false;
                } else {
                    extractInfo.normalizedStr += digitStr;

                    if (hasPendingSpace) {
                        extractInfo.normalizeReason = extractInfo.normalizeReason || {};
                        extractInfo.normalizeReason.removeSpace = true;
                        extractInfo.spaceIncluded = true;
                        hasPendingSpace = false;
                    }
                }

                prevIsSeparator = false;
            } else if (this._visibleSpaceRegExp.test(c)) {
                if (!prevIsSeparator) {
                    tmpSpace = c;
                }

                hasPendingSpace = true;
                prevIsSeparator = false;
            } else if (this._invisibleSpaceRegExp.test(c)) {
                hasPendingSpace = true;
                prevIsSeparator = false;
            } else {
                // Dot
                if (cp === 0x002E || cp === 0x00B7 || cp === 0x02D9) {
                    extractInfo.decimalStr += '.';
                    extractInfo.normalizedStr += '.';

                    if (cp !== 0x002E) {
                        extractInfo.normalizeReason = extractInfo.normalizeReason || {};
                        extractInfo.normalizeReason.normalizeDecimalPoint = true;
                    }
                } else {
                    if (thousandSeparator && c !== thousandSeparator) {
                        if (hasPendingSpace) {
                            break;
                        }

                        hasMultiSeparator = true;
                    }

                    extractInfo.normalizedStr += c;
                    thousandSeparator = c;
                }

                if (hasPendingSpace) {
                    extractInfo.spaceIncluded = true;
                    extractInfo.normalizeReason = extractInfo.normalizeReason || {};
                    extractInfo.normalizeReason.removeSpace = true;
                    tmpSpace = '';
                    hasPendingSpace = false;
                }

                extractInfo.separatorIncluded = true;
                prevIsSeparator = true;
            }

            extractInfo.matchedStr += c;
        }

        if (!digitCount) {
            return null;
        }

        extractInfo.matchedStr = extractInfo.matchedStr.trimRight();

        if (thousandSeparator && !hasMultiSeparator) {
            extractInfo.thousandSeparator = thousandSeparator;
        }

        return extractInfo;
    }

    private getBracketsNumberExtractInfo(matchedStr: string): ExtractInfo | null {
        const extractInfo: ExtractInfo = {
            matchedStr,
            normalizedStr: '',
            decimalStr: ''
        };

        let digitCount = 0;

        for (let i = 0; i < matchedStr.length; i++) {
            const c = matchedStr[i];
            const cp = c.codePointAt(0) as number;

            if (cp >= 0x1040 && cp <= 0x1049) {
                ++digitCount;
                extractInfo.normalizedStr += c;
                extractInfo.decimalStr += c;
            } else if (cp === 0x101D || cp === 0x104E) {
                extractInfo.normalizeReason = extractInfo.normalizeReason || {};
                if (cp === 0x101D) {
                    extractInfo.normalizedStr += '\u1040';
                    extractInfo.decimalStr += '\u1040';
                    extractInfo.normalizeReason.changeU101DToU1040 = true;
                } else {
                    extractInfo.normalizedStr += '\u1044';
                    extractInfo.decimalStr += '\u1044';
                    extractInfo.normalizeReason.changeU104EToU1044 = true;
                }
            } else if (cp === 0x0028 || cp === 0x005B || cp === 0xFF08 || cp === 0xFF3B) {
                if (!this.hasCorrectClosingBracket(cp, matchedStr.substring(i + 1))) {
                    return null;
                }

                extractInfo.normalizedStr += c;
            } else if (this._containsSpaceRegExp.test(c)) {
                extractInfo.spaceIncluded = true;
                extractInfo.normalizeReason = extractInfo.normalizeReason || {};
                extractInfo.normalizeReason.removeSpace = true;
            } else {
                extractInfo.normalizedStr += c;
            }
        }

        if (!digitCount) {
            return null;
        }

        return extractInfo;
    }

    private hasCorrectClosingBracket(openingBracketCp: number, str: string): boolean {
        for (const c of str) {
            const cp = c.codePointAt(0) as number;
            if ((cp === 0x0029 || cp === 0xFF09) && (openingBracketCp === 0x0028 || openingBracketCp === 0xFF08)) {
                return true;
            }

            if ((cp === 0x005D || cp === 0xFF3D) && (openingBracketCp === 0x005B || openingBracketCp === 0xFF3B)) {
                return true;
            }
        }

        return false;
    }

    private checkRightStrSafeForDateAndPhoneNumber(rightStr: string, extractInfo: ExtractInfo): boolean {
        if (this.checkRightStrForPossibleDigit(rightStr)) {
            return false;
        }

        if ((rightStr.length > 1 && this._aThetRegExp.test(rightStr)) || this._diacriticsRegExp.test(rightStr)) {
            return false;
        }

        if ((rightStr[0] === '$' || rightStr[0] === '%') && (!extractInfo.separatorIncluded || extractInfo.spaceIncluded)) {
            return false;
        }

        if (rightStr.length > 1) {
            let shouldCheckRightStr2ForPossibleDigit = false;
            if ((!extractInfo.separatorIncluded || extractInfo.spaceIncluded) && this._containsSpaceRegExp.test(rightStr[0])) {
                shouldCheckRightStr2ForPossibleDigit = true;
            } else if (this._dashRegExp.test(rightStr[0]) ||
                this._dotRegExp.test(rightStr[0]) ||
                this._slashRegExp.test(rightStr[0]) ||
                this._thousandSeparatorRegExp.test(rightStr[0])) {
                shouldCheckRightStr2ForPossibleDigit = true;
            } else if (rightStr[0] === '@') {
                if (this._possibleDomainNameSuffixRegExp.test(rightStr.substring(1))) {
                    return false;
                }

                shouldCheckRightStr2ForPossibleDigit = true;
            }

            if (shouldCheckRightStr2ForPossibleDigit) {
                const rightStr2 = rightStr.substring(1);
                if (this.checkRightStrForPossibleDigit(rightStr2) && !this._dtTimeRegExp.test(rightStr2)) {
                    return false;
                }
            }
        }

        return true;
    }

    private checkRightStrForPossibleDigit(rightStr: string): boolean {
        const cp = rightStr.codePointAt(0);
        if (!cp) {
            return false;
        }

        if (cp >= 0x1040 && cp <= 0x1049) {
            return true;
        }

        if (rightStr.length > 1 && (cp === 0x101D || cp === 0x104E) &&
            this._possibleDigitGroupStartsWithU101DOrU104ERegExp.test(rightStr)) {
            return true;
        }

        return false;
    }

    private matchDecimalGroup(input: string): RegExpMatchArray | null {
        let m = input.match(this._decimalGroupWithSeparatorRegExp);
        if (m == null) {
            m = input.match(this._decimalGroupWithSpaceSeparatorRegExp);
        }
        if (m == null) {
            m = input.match(this._decimalGroupRegExp);
        }

        return m;
    }
}