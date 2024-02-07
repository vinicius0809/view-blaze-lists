import { Component, Input } from '@angular/core';
import { Firestore, collectionData } from '@angular/fire/firestore';
import { collection } from 'firebase/firestore';
import { Observable, map } from 'rxjs';

interface ListElement {
  minute: number;
  predictedColor: string;
  predictedPercentage?: string;
  resultColors: string[];
  result: string;
  actualGradient: number;
  actualGradientText: string;
  considered: string;
  consideredWin: string;
}

interface List {
  inverse: boolean;
  listBalance: number;
  listHour: number;
  listLosses: number;
  listWhites: number;
  listWins: number;
  listSize: number;
  listGradient: number;
  listElements: ListElement[];
}

@Component({
  selector: 'app-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.css']
})
export class ListComponent {
  selectedHour: number;
  balanceG3: number = 0;
  balanceG5: number = 0;
  balanceG7: number = 0;
  totalLoss: number = 0;
  totalWins: number = 0;
  lists$: Observable<List[]> = new Observable<List[]>();

  @Input()
  get hour() {
    return this.selectedHour;
  }

  set hour(value: number) {
    if (this.selectedHour != value) {
      this.selectedHour = value;
      this.updateLists();
    }
  }

  constructor(private firestore: Firestore) {
    this.selectedHour = new Date().getHours();
    this.updateLists();
  }

  private updateLists() {
    const gradientLimiar = 0;
    const insideListsCollection = collection(
      this.firestore,
      `lists/${this.getDateStringFormatted(new Date())}_${this.selectedHour}/inside-lists`
    );
    this.lists$ = collectionData(insideListsCollection) as Observable<List[]>;
    this.lists$ = this.lists$.pipe(
      map((r) => {
        let consecutiveLossesG3 = 0;
        let consecutiveLossesG5 = 0;
        let consecutiveLossesG7 = 0;
        if (r.length > 1) {
          this.totalLoss = 0;
          this.totalWins = 0;
          this.balanceG3 = 0;
          this.balanceG5 = 0;
          this.balanceG7 = 0;
          let consideredList = -1;
          for (let i = 0; i < r[0].listElements.length; i++) {
            const elements1 = [r[0].listElements[i], r[0].listElements[i - 1], r[0].listElements[i - 2], r[0].listElements[i - 3]];
            const elements2 = [r[1].listElements[i], r[1].listElements[i - 1], r[1].listElements[i - 2], r[1].listElements[i - 3]];
            const element1 = elements1[0];
            const element2 = elements2[0];
            element1.consideredWin = "";
            element2.consideredWin = "";

            if (consideredList > -1) {
              if (r[consideredList].listElements[i].result == "") {
                r[consideredList].listElements[i].consideredWin = "🕖"
              }
              else if (r[consideredList].listElements[i].result != "❌") {
                r[consideredList].listElements[i].consideredWin = "✔️";
                this.totalWins++;
                this.balanceG3++;
                this.balanceG5++;
                this.balanceG7++;
                consecutiveLossesG5 = 0;
                consecutiveLossesG7 = 0;
                consecutiveLossesG3 = 0;
              }
              else if (r[consideredList].listElements[i].result == "❌") {
                r[consideredList].listElements[i].consideredWin = "🔺";
                this.totalLoss++;
                consecutiveLossesG5++;
                consecutiveLossesG7++;
                consecutiveLossesG3++;

                if (consecutiveLossesG3 > 1) {
                  this.balanceG3 -= 15;
                  consecutiveLossesG3 = 0;
                }
                if (consecutiveLossesG5 > 2) {
                  this.balanceG5 -= 63;
                  consecutiveLossesG5 = 0;
                }
                if (consecutiveLossesG7 > 3) {
                  this.balanceG7 -= 255;
                  consecutiveLossesG7 = 0;
                }
              }
            }

            element1.actualGradientText = getActualGradientText(element1.actualGradient);
            element2.actualGradientText = getActualGradientText(element2.actualGradient);
            element1.considered = ""
            element2.considered = ""
            consideredList = -1;

            // if (i < 3) {
              if (element1.result != "" && element1.actualGradient - element2.actualGradient > gradientLimiar) {
                element1.considered = "🟦";
                consideredList = 0;
              }
              else if (element2.result != "" && element2.actualGradient - element1.actualGradient > gradientLimiar) {
                element2.considered = "🟦";
                consideredList = 1;
              }

            // }
            // else {
            //   const twoConsecutiveLosses1 = this.returnConsecutivePattern(elements1);
            //   const twoConsecutiveLosses2 = this.returnConsecutivePattern(elements2);
            //   if (element1.result != "" && (element1.actualGradient - element2.actualGradient > gradientLimiar || (elements1[1].considered == "🟦" && !twoConsecutiveLosses1 || twoConsecutiveLosses2))) {
            //     element1.considered = "🟦";
            //     consideredList = 0;
            //   }
            //   else if (element2.result != "" && (element2.actualGradient - element1.actualGradient > gradientLimiar || (elements2[1].considered == "🟦" && !twoConsecutiveLosses2 || twoConsecutiveLosses1))) {
            //     element2.considered = "🟦";
            //     consideredList = 1;
            //   }
            // }
          }
        }
        return r.sort((a, b) => b.listGradient - a.listGradient);
      })
    );
  }

  private returnConsecutivePattern(elements: ListElement[]) {
    let countLoss = 0;
    elements.forEach(el => {
      countLoss += el.result.includes("❌") ? 1 : 0;
    });

    const lossPatterns = [
      [["❌", "✅", "✅(⚪️)","💚(⚪️)"], ["❌", "✅", "✅(⚪️)","💚(⚪️)"], ["❌"]],
      [["❌", "✅", "✅(⚪️)","💚(⚪️)"], ["❌"], ["❌", "✅", "✅(⚪️)","💚(⚪️)"]],
      [["❌"], ["❌", "✅", "✅(⚪️)","💚(⚪️)"], ["❌", "✅", "✅(⚪️)","💚(⚪️)"]],
    ];
    // const lossPatterns = [
    //   [["❌", "✅", "✅(⚪️)", "💚(⚪️)"], ["❌", "✅", "✅(⚪️)", "💚(⚪️)"], ["❌", "✅", "✅(⚪️)", "💚(⚪️)"]],
    //   [["❌", "✅", "✅(⚪️)", "💚(⚪️)"], ["❌", "✅", "✅(⚪️)", "💚(⚪️)"], ["❌", "✅", "✅(⚪️)", "💚(⚪️)"]],
    //   [["❌", "✅", "✅(⚪️)", "💚(⚪️)"], ["❌", "✅", "✅(⚪️)", "💚(⚪️)"], ["❌", "✅", "✅(⚪️)", "💚(⚪️)"]],
    // ];
    let thisElementsIsOnLossPattern = true;

    lossPatterns.forEach(lossPattern => {
      lossPattern.forEach(lossPatternArray => {
        let thisListIsLoss = true;
        for (let i = 0; i < lossPatternArray.length; i++) {
          const lossPatternElement = lossPatternArray[i];
          const listElement = elements[i].result;

          if (!lossPatternArray.includes(listElement)) {
            thisListIsLoss = false;
          }
        }
        thisElementsIsOnLossPattern = thisListIsLoss;
      });
    });

    return thisElementsIsOnLossPattern;

    return (["❌", "✅", "✅(⚪️)"].includes(elements[0].result) && ["❌", "✅", "✅(⚪️)"].includes(elements[1].result) && ["❌"].includes(elements[2].result))
      || (["❌", "✅", "✅(⚪️)"].includes(elements[0].result) && ["❌"].includes(elements[1].result) && ["❌", "✅", "✅(⚪️)"].includes(elements[2].result))
      || (["❌"].includes(elements[0].result) && ["❌", "✅", "✅(⚪️)"].includes(elements[1].result) && ["❌", "✅", "✅(⚪️)"].includes(elements[2].result))
      || countLoss > 0;
  }

  getDateStringFormatted(date: Date) {
    return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${(date.getDate()).toString().padStart(2, '0')}`;
    // return `${date.getFullYear()}-09-30`;
  }
}
function getActualGradientText(actualGradient: number): string {
  let actualGradientText = "";
  if (actualGradient >= 0) {
    actualGradientText = "🟩 +" + actualGradient;
  }
  else if (actualGradient < 0) {
    actualGradientText = "🟥 " + actualGradient;
  }
  return actualGradientText;
}

