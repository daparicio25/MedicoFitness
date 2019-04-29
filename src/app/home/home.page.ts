import { Component } from '@angular/core';

//FIREBASE
import { AngularFirestore } from 'angularfire2/firestore';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {

  array = [];
  data : nuevoEsquema;
  dataSend: nuevoEsquema[] = [];
  ban: boolean = false;

  constructor(private fire: AngularFirestore) {
    /*this.fire.collection<any>("/meditions/").valueChanges().subscribe((data)=>{
      this.array = data;
    });*/
  }

  imprimir() {
    var cad = '{"uid":"00nmSle4CMqexa0RqrcH","medition_type":1,"user_uid":"eVtBOsEhpQIpC0jVwzbx","weight":"65.8","muscle_mass":"40","bmi":"22.2","tmb":"1623.0","visceral_fat":"25","body_fat":"12","bonne_mass":"13.25","metabolic_age":"23","body_water":"65.75","diastolic_pressure":"2.45","systolic_pressure":"18.98","heart_rate":"90/100","glucose":"10.25","urico_acid":"23.56","cholesterol":"8.93","steps":"12846","stomach":"70","hip":"20","chest":"90","biceps":"25.73","thigh":"59.23","calf":"54.3","neck":"23.87","size":"171","head":"54.23","height_baby":"32.45","created_at":"2018-12-17T15:42:05.262Z"}';

    this.array[0] = JSON.parse(cad);

    let item;
    let unit = "";
    for (var i=0; i<this.array.length; i++)
    {
      item = this.array[i];

      this.getUnit(item["user_uid"])
      .then(respuesta => this.spliceData(item, respuesta))
      .catch(error => console.log(error));
    }
  }

  spliceData(item, unit) {
    console.log("\n------------");
    console.log("Unit: " + unit);
    console.log(item);

    for (var key in item) {
      var arre = ["uid", "medition_type", "created_at", "user_uid"];
      if (arre.indexOf(key) == -1) {
        console.log(key + " --> " + item[key]);
        let idDoc = this.fire.createId();
        this.data = this.nuevoDato(idDoc, item["created_at"], item["user_uid"], key, item[key], unit, item["medition_type"])

        console.log(this.data);
        this.fire.doc("/prueba/" + idDoc).set(this.data);
      }
    }
  }

  getUnit = (user_id:string) => {
    let promise = new Promise((resolve, reject) => {
      let unit = "";
      console.log("user_id: " + user_id);

      this.fire.collection<any>("/users/").doc(user_id).valueChanges().subscribe((data)=>{
        console.log("* USUARIO *");
        console.log(data);
        var strObj = JSON.stringify(data);
        var objJson = JSON.parse(strObj);
        unit = objJson.weight_unity;
        resolve(unit);
      });
    });
    return promise;
  }

  nuevoDato(id:string, effectiveDateTime:string, subject:string, key:string, value:number, unit: string, medition_type:number): nuevoEsquema {
    return {
      _id: id,
      effectiveDateTime: effectiveDateTime,
      subject: subject,
      code: {
        text: key,
      },
      valueQuantity: {
        value: value,
        unit: this.obtenerMedida(key, unit)
      },
      deviceName: {
        name: this.obtenerDisp(medition_type)
      }
    };
  }

  obtenerMedida(key: string, unit: string): string {
    let meditions = "";

    switch(key) {
      case "weight":
      case "muscle_mass":
      case "bonne_mass":
        meditions = "Kg";
        break;
      case "bmi":
        meditions = "Kg/m²";
        break;
      case "tmb":
        meditions = "Kcal";
        break;
      case "visceral_fat":
      case "body_fat":
      case "body_water":
        meditions = "%";
        break;
      case "metabolic_age":
        meditions = "";
        break;
      case "diastolic_pressure":
      case "systolic_pressure":
        meditions = "mmHg";
        break;
      case "heart_rate":
        meditions = "lat/min";
        break;
      case "glucose":
      case "urico_acid":
      case "cholesterol":
        meditions = "mg/dl";
        break;
      case "stomach":
      case "hip":
      case "chest":
      case "biceps":
      case "thigh":
      case "calf":
      case "neck":
      case "size":
      case "head":
      case "height_baby":
        meditions = "cm";
        break;
      default:
        console.log("\n--- DEFAULT ERROR ---");
    }

    if (unit.toLowerCase() == "lb") {
      if (meditions.toLowerCase() == "kg") { meditions = "Lb"; }

      if (meditions.toLowerCase() == "cm") { meditions = "in"; }
    }
    return meditions;
  }

  obtenerDisp(medition_type: number): string {
    let device = "";

    switch(medition_type) {
      case 1:
        device = "Scale MedicoFitness";
        break;
      case 2:
        device = "Heart MedicoFitness";
        break;
      case 3:
        device = "GCU MedicoFitness";
        break;
      case 5:
          device = "Corporal MedicoFitness";
          break;
    }

    return device;
  }

}

interface nuevoEsquema {
  _id: string;
  effectiveDateTime?:string;
  subject:string;
  code?: Icode;
  valueQuantity?: IvalueQuantity;
  deviceName?: IdeviceName;
}

interface Icode {
  text?:string;
}

interface IvalueQuantity {
  value?: number;
  unit?: string;
}

interface IdeviceName {
  name?: string;
}
