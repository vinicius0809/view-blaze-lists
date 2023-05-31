import { Component, Input } from '@angular/core';
import {
  Firestore,
  docData,
  doc
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';

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
  listElements: ListElement[];
}

interface RootList {
  [key: string]: List[];
}

@Component({
  selector: 'app-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.css']
})
export class ListComponent {
  tableData2!: RootList;
  selectedHour: number;
  public readonly testDocValue$: Observable<any>;
  tableData: List[] = [];

  @Input()
  get hour(){
    return this.selectedHour;
  }

  constructor(private firestore: Firestore) {
    this.selectedHour = new Date().getHours();
    console.log("lists/" + this.getDateStringFormated(new Date()));
    const ref = doc(firestore, "lists/" + this.getDateStringFormated(new Date()));
    this.testDocValue$ = docData(ref);
    this.testDocValue$.subscribe(x => {
      console.log(x);
      this.tableData2 = x;
      this.updateTableData();
    });
  }

  updateTableData() {
    console.log("Entrou " + this.selectedHour);
    for (let i = 0; i < 24; i++) {
      if (this.tableData2[i] != undefined && i == this.selectedHour) {        
        this.tableData2[i].sort((a,b) => b.listBalance - a.listBalance);
        this.tableData2[i].forEach(listObj => {
          const index = this.tableData.findIndex(x => x.listHour == listObj.listHour && x.listSize == listObj.listSize && x.inverse == listObj.inverse);
          if (index == -1) {
            this.tableData.push(listObj);
          }
          else {
            this.tableData[index] = listObj;
          }
        })
      }
    }
  }

  getDateStringFormated(date: Date) {
    return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
  }
}
