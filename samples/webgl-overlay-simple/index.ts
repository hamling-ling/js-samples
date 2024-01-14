/**
 * @license
 * Copyright 2021 Google LLC.
 * SPDX-License-Identifier: Apache-2.0
 */

// [START maps_webgl_overlay_simple]
// [START maps_webgl_overlay_simple_init_map]
import {
  AmbientLight,
  DirectionalLight,
  Matrix4,
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
  BoxGeometry,
  Mesh,
  MeshBasicMaterial
} from "three";

import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";

let map: google.maps.Map;

const trianglePoints =  [
  { lat: 35.6933129, lng: 139.7006083},
  { lat: 35.6933675, lng:139.7000022},
  { lat: 35.6927859, lng:139.7002795},
  { lat: 35.6933129, lng: 139.7006083}
]

const mapOptions = {
  tilt: 0,
  heading: 0,
  zoom: 18,
  //center: { lat: 35.6594945, lng: 139.6999859 },
  center: { lat: 35.6933129, lng: 139.7006083 },
  mapId: "15431d2b469f209e",
  // disable interactions due to animation loop and moveCamera
  disableDefaultUI: true,
  gestureHandling: "none",
  keyboardShortcuts: false,
};

function initMap(): void {
  const mapDiv = document.getElementById("map") as HTMLElement;
  map = new google.maps.Map(mapDiv, mapOptions);

  new google.maps.Polygon({
    map,
    paths: trianglePoints,
    strokeColor: "#FF0000",
    strokeOpacity: 0.8,
    strokeWeight: 2,
    fillColor: "#FF0000",
    fillOpacity: 0.35,
    geodesic: true,
  })

  initWebglOverlayView(map);
}
// [END maps_webgl_overlay_simple_init_map]

// [START maps_webgl_overlay_simple_on_add]
function initWebglOverlayView(map: google.maps.Map): void {
  let scene, renderer, camera, loader;
  const webglOverlayView = new google.maps.WebGLOverlayView();

  webglOverlayView.onAdd = () => {
    // Set up the scene.

    scene = new Scene();

    camera = new PerspectiveCamera();

    const ambientLight = new AmbientLight(0xffffff, 0.75); // Soft white light.
    scene.add(ambientLight);

    const directionalLight = new DirectionalLight(0xffffff, 0.25);
    directionalLight.position.set(0.5, -1, 0.5);
    scene.add(directionalLight);

    // draw cube
    // If we want LatLong position, we may use helper functions described
    // here: https://github.com/googlemaps/js-three
    const geometry = new BoxGeometry( 100, 100, 100 ); 
    const material = new MeshBasicMaterial( {
                                              color: 0x00ff00,
                                              opacity: 0.1,
                                              transparent: true
                                            } ); 
    const cube = new Mesh( geometry, material ); 

    scene.add( cube );

    // Load the model.
    loader = new GLTFLoader();
    const source =
      "https://raw.githubusercontent.com/googlemaps/js-samples/main/assets/pin.gltf";
    loader.load(source, (gltf) => {
      gltf.scene.scale.set(10, 10, 10);
      gltf.scene.rotation.x = Math.PI; // Rotations are in radians.
      scene.add(gltf.scene);
    });
  };

  // [END maps_webgl_overlay_simple_on_add]
  // [START maps_webgl_overlay_simple_on_context_restored]
  webglOverlayView.onContextRestored = ({ gl }) => {
    // Create the js renderer, using the
    // maps's WebGL rendering context.
    renderer = new WebGLRenderer({
      canvas: gl.canvas,
      context: gl,
      ...gl.getContextAttributes(),
    });
    renderer.autoClear = false;

    // Wait to move the camera until the 3D model loads.
    loader.manager.onLoad = () => {
      renderer.setAnimationLoop(() => {
        webglOverlayView.requestRedraw();
        const { tilt, heading, zoom } = mapOptions;
        map.moveCamera({ tilt, heading, zoom });

        // Rotate the map 360 degrees.
        if (mapOptions.tilt < 67.5) {
          mapOptions.tilt += 0.5;
        } else if (mapOptions.heading <= 360) {
          mapOptions.heading += 0.2;
          mapOptions.zoom -= 0.0005;
        } else {
          renderer.setAnimationLoop(null);
        }
      });
    };
  };

  // [END maps_webgl_overlay_simple_on_context_restored]
  // [START maps_webgl_overlay_simple_on_draw]
  webglOverlayView.onDraw = ({ gl, transformer }): void => {
    const latLngAltitudeLiteral: google.maps.LatLngAltitudeLiteral = {
      lat: mapOptions.center.lat,
      lng: mapOptions.center.lng,
      altitude: 100,
    };

    // Update camera matrix to ensure the model is georeferenced correctly on the map.
    const matrix = transformer.fromLatLngAltitude(latLngAltitudeLiteral);
    camera.projectionMatrix = new Matrix4().fromArray(matrix);

    webglOverlayView.requestRedraw();
    renderer.render(scene, camera);

    // Sometimes it is necessary to reset the GL state.
    renderer.resetState();
  };
  // [END maps_webgl_overlay_simple_on_draw]
  // [START maps_webgl_overlay_simple_add_to_map]
  webglOverlayView.setMap(map);
  // [END maps_webgl_overlay_simple_add_to_map]
}

declare global {
  interface Window {
    initMap: () => void;
  }
}
window.initMap = initMap;
// [END maps_webgl_overlay_simple]
export {};
