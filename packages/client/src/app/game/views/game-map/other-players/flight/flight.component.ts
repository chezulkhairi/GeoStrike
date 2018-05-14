import {Component, OnInit, NgZone, OnDestroy, ChangeDetectorRef, Input, Output} from '@angular/core';
import {Subscription} from 'rxjs/Subscription';
import {Subject} from 'rxjs/Subject';
import {Observable} from 'rxjs/Observable';

import {AcEntity, AcNotification, ActionType, CesiumService} from 'angular-cesium';
import {FlightService} from '../flight.service';
import {CharacterService, ViewState} from '../../../../services/character.service';
import {UtilsService} from '../../../../services/utils.service';
import {InterpolationService, InterpolationType} from '../../../../services/interpolation.service';
import {Player, CharacterData, PlayerLocation, Location} from '../../../../../types'
import "rxjs/add/operator/take";
import { environment } from '../../../../../../environments/environment';



@Component({
  selector: 'flight',
  templateUrl: './flight.component.html',
})
export class FlightComponent implements  OnInit {
  flightSubscription: Subscription;
  @Input() private flights$: Observable<AcNotification>;
  isOverview$: Observable<boolean>;
  listPlaneMap = new Map<string, any>();

  constructor(private flightService: FlightService,
              public character: CharacterService,
              private ngZone: NgZone,
              public utils: UtilsService,
              private cd: ChangeDetectorRef,
              private cesiumService: CesiumService) {
    this.isOverview$ = character.viewState$.map(viewState => viewState === ViewState.OVERVIEW);
  }

  ngOnInit() {
    // console.log("init flight component");

    // this.character.viewState$.subscribe(characterState => {
    //
    //   if(characterState === ViewState.OVERVIEW){
    //       console.log(this.cesiumService.getScene()._primitives._primitives)
    //   }
    // })
  }

  planeTypeModel(typeModel) {
    switch (typeModel) {
      case 1:
        return '/assets/models/planes/a318.glb';
      case 2:
        return '/assets/models/planes/atr42.glb';
      case 3:
        return '/assets/models/planes/plane.gltf';
      default:
        return '/assets/models/planes/plane.gltf';
    }
  }

  getOrientation(flight) {
  const normalizedHeading = (flight.currentLocation.heading.toFixed(0)-90)%360;
    if (flight.state === 'DEAD') {
      // TODO: kill the Plane.
    } else {
      return this.utils.getOrientation(this.degreesToCartesian(flight.currentLocation.location),normalizedHeading , 0, 0);
    }
  }

  VelocityVectorProperty(flight) {
    const flightId = flight.id;
    const positionProperty = this.listPlaneMap.get(flightId);
    return new Cesium.VelocityVectorProperty(positionProperty);
  }

  interpolatePosition(flight) {
    const flightId = flight.id;
    const positionProperty = this.listPlaneMap.get(flightId);
    if (!positionProperty) {
      const result = InterpolationService.interpolate({
        data: this.degreesToCartesian(flight.currentLocation.location),
      }, InterpolationType.POSITION);
      this.listPlaneMap.set(flightId, result);
      // return result;
    }
    else {
      const remainSec = flight.remainTime? flight.remainTime: environment.config.updateFlightIntervalSec;
      const newTime = Cesium.JulianDate.addSeconds(
                      Cesium.JulianDate.now(),remainSec, new Cesium.JulianDate());
                      // Cesium.JulianDate.now(),remainSec, new Cesium.JulianDate());
      const result = InterpolationService.interpolate({
        time: newTime,
        data: this.degreesToCartesian(flight.currentLocation.location),
        cesiumSampledProperty: positionProperty,
      });
      return result;
    }
  }

  degreesToCartesian(location) {
    return new Cesium.Cartesian3.fromDegrees(location.x, location.y, location.z);
  }


}
