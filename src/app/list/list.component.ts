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
