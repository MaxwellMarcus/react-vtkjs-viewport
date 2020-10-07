import macro from 'vtk.js/Sources/macro';
import vtkInteractorStyleSlice from './vtkInteractorStyleSlice.js';
import Constants from 'vtk.js/Sources/Rendering/Core/InteractorStyle/Constants';
import vtkPlaneManipulator from 'vtk.js/Sources/Widgets/Manipulators/PlaneManipulator';
import * as vtkMath from 'vtk.js/Sources/Common/Core/Math';

const { States } = Constants;

// ----------------------------------------------------------------------------
// Global methods
// ----------------------------------------------------------------------------

// ----------------------------------------------------------------------------
// vtkInteractorStyleMPRCrosshairs methods
// ----------------------------------------------------------------------------

function vtkInteractorStyleCrosshairsImageMapper(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkInteractorStyleCrosshairsImageMapper');
  model.planeManipulator = vtkPlaneManipulator.newInstance();

  publicAPI.resetCrosshairs = () => {
    const { apis, apiIndex } = model;
    const api = apis[apiIndex];

    api.svgWidgets.crosshairsWidget.moveCrosshairs(
      publicAPI.getSliceCenter(),
      apis,
      apiIndex
    );

    publicAPI.invokeInteractionEvent({ type: 'InteractionEvent' });
  };

  publicAPI.moveCrosshairs = callData => {
    const { apis, apiIndex } = model;
    const api = apis[apiIndex];

    model.planeManipulator.setNormal(publicAPI.getSliceNormal());
    model.planeManipulator.setOrigin(publicAPI.getSliceCenter());
    const worldCoords = model.planeManipulator.handleEvent(
      callData,
      api.genericRenderWindow.getOpenGLRenderWindow()
    );

    api.svgWidgets.crosshairsWidget.moveCrosshairs(worldCoords, apis, apiIndex);

    publicAPI.invokeInteractionEvent({ type: 'InteractionEvent' });
  };

  publicAPI.updateCrosshairsAfterScroll = () => {
    const { apis, apiIndex } = model;
    const api = apis[apiIndex];

    const renderer = api.genericRenderWindow.getRenderer();
    const camera = renderer.getActiveCamera();
    api.actors.forEach(actor => {
      actor.getMapper().setSliceFromCamera(camera);
    });

    let worldCoords = api.get('cachedCrosshairWorldPosition');
    // we want to reuse the cached coords, replacing for our new slice (set by camera)
    worldCoords[api.sliceMode] = camera.getFocalPoint()[api.sliceMode];
    api.svgWidgets.crosshairsWidget.moveCrosshairs(worldCoords, apis, apiIndex);

    publicAPI.invokeInteractionEvent({ type: 'InteractionEvent' });
  };

  const superHandleMouseMove = publicAPI.handleMouseMove;
  publicAPI.handleMouseMove = callData => {
    if (model.state === States.IS_PAN) {
      publicAPI.moveCrosshairs(callData);
    } else if (superHandleMouseMove) {
      superHandleMouseMove(callData);
    }
  };

  const superHandleLeftButtonPress = publicAPI.handleLeftButtonPress;
  publicAPI.handleLeftButtonPress = callData => {
    if (!callData.shiftKey && !callData.controlKey) {
      if (model.volumeActor) {
        publicAPI.moveCrosshairs(callData);
        publicAPI.startPan();
      }
    } else if (superHandleLeftButtonPress) {
      superHandleLeftButtonPress(callData);
    }
  };

  publicAPI.superHandleLeftButtonRelease = publicAPI.handleLeftButtonRelease;
  publicAPI.handleLeftButtonRelease = () => {
    switch (model.state) {
      case States.IS_PAN:
        publicAPI.endPan();
        break;

      default:
        publicAPI.superHandleLeftButtonRelease();
        break;
    }
  };

  publicAPI.superHandleMouseWheel = publicAPI.handleMouseWheel;
  publicAPI.handleMouseWheel = callData => {
    publicAPI.superHandleMouseWheel(callData);
    publicAPI.updateCrosshairsAfterScroll();
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Inheritance
  vtkInteractorStyleSlice.extend(publicAPI, model, initialValues);

  macro.setGet(publicAPI, model, ['callback', 'apis', 'apiIndex']);

  // Object specific methods
  vtkInteractorStyleCrosshairsImageMapper(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(
  extend,
  'vtkInteractorStyleCrosshairsImageMapper'
);

// ----------------------------------------------------------------------------

export default Object.assign({ newInstance, extend });
