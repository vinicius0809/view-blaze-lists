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
    const insideListsCollection = collection(
      this.firestore,
      `lists/${this.getDateStringFormatted(new Date())}_${this.selectedHour}/inside-lists`
    );
    this.lists$ = collectionData(insideListsCollection) as Observable<List[]>;
    this.lists$ = this.lists$.pipe(
      map((r) => {
        if (r.length > 1) {
          for (let i = 0; i < r[0].listElements.length; i++) {
            const element1 = r[0].listElements[i];
            const element2 = r[1].listElements[i];

            element1.actualGradientText = getActualGradientText(element1.actualGradient);
            element2.actualGradientText = getActualGradientText(element2.actualGradient);

            if(element1.actualGradient > element2.actualGradient){
              element1.considered = "🟦"
            }
            else if(element2.actualGradient > element1.actualGradient){
              element2.considered = "🟦"
            }else{
              element1.considered = ""
              element2.considered = ""
            }
          }
        }
        return r.sort((a, b) => b.listGradient - a.listGradient);
      })
    );
  }

  getDateStringFormatted(date: Date) {
    return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date
      .getDate()
      .toString()
      .padStart(2, '0')}`;
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

