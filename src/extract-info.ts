/**
 * @license
 * Copyright DagonMetric. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found under the LICENSE file in the root directory of this source tree.
 */

export interface ExtractInfo {
    totalTrimedInputLength: number;
    curStr: string;
    trimedCurStrLength: number;
    firstCp: number;
    lastKnownWritingStyle?: 'uni' | 'zg' | null;
    lastKnownWritingStyleProbability?: number;
}
