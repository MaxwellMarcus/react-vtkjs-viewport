import React, { Component } from 'react';
import PropTypes from 'prop-types';
import vtkGenericRenderWindow from 'vtk.js/Sources/Rendering/Misc/GenericRenderWindow';
import vtkWidgetManager from 'vtk.js/Sources/Widgets/Core/WidgetManager';
import vtkSVGWidgetManager from './vtkSVGWidgetManager';
import vtkOrientationMarkerWidget from 'vtk.js/Sources/Interaction/Widgets/OrientationMarkerWidget';
import vtkAnnotatedCubeActor from 'vtk.js/Sources/Rendering/Core/AnnotatedCubeActor';
import AnnotatedCubePresets from 'vtk.js/Sources/Rendering/Core/AnnotatedCubeActor/Presets';

import { createSub } from '../lib/createSub.js';

export default class View3DMarchingCubes extends Component {
  static propTypes = {
    actors: PropTypes.array,
    sourceDataDirection: PropTypes.object,
    onCreated: PropTypes.func,
    onDestroyed: PropTypes.func,
    dataDetails: PropTypes.object,
  };

  constructor(props) {
    super(props);

    this.genericRenderWindow = null;
    this.widgetManager = vtkWidgetManager.newInstance();
    this.container = React.createRef();
    this.subs = {
      interactor: createSub(),
    };
    this.interactorStyleSubs = [];
    this.apiProperties = {};
  }

  componentDidMount() {
    this.genericRenderWindow = vtkGenericRenderWindow.newInstance({
      background: [0, 0, 0],
    });

    this.genericRenderWindow.setContainer(this.container.current);

    let actors = [];

    this.renderer = this.genericRenderWindow.getRenderer();
    this.renderWindow = this.genericRenderWindow.getRenderWindow();
    const interactor = this.renderWindow.getInteractor();

    this.widgetManager.disablePicking();
    this.widgetManager.setRenderer(this.renderer);

    // setup orientation widget
    this.axes = vtkAnnotatedCubeActor.newInstance();
    this.orientationWidget = vtkOrientationMarkerWidget.newInstance({
      actor: this.axes,
      interactor: interactor,
    });

    if (this.props.sourceDataDirection) {
      const direction = this.props.sourceDataDirection;
      const planes = [
        direction.slice(0, 3),
        direction.slice(3, 6),
        direction.slice(6, 9),
      ];
      const orient = planes.map(arr =>
        arr.findIndex(i => Math.abs(Math.round(i)) === 1)
      );

      const sagPlane = orient.indexOf(0);
      const corPlane = orient.indexOf(1);
      const axPlane = orient.indexOf(2);

      const sagFlip = planes[sagPlane].some(i => Math.round(i) === -1);
      const corFlip = planes[corPlane].some(i => Math.round(i) === -1);
      const axFlip = planes[axPlane].some(i => Math.round(i) === -1);

      const lpsPresets = vtkAnnotatedCubeActor.newInstance();
      AnnotatedCubePresets.applyPreset('lps', lpsPresets);
      let sagPlus, sagMinus;
      if (sagFlip) {
        sagPlus = lpsPresets.getXMinusFaceProperty();
        sagMinus = lpsPresets.getXPlusFaceProperty();
      } else {
        sagPlus = lpsPresets.getXPlusFaceProperty();
        sagMinus = lpsPresets.getXMinusFaceProperty();
      }

      let corPlus, corMinus;
      if (corFlip) {
        corPlus = lpsPresets.getYMinusFaceProperty();
        corMinus = lpsPresets.getYPlusFaceProperty();
      } else {
        corPlus = lpsPresets.getYPlusFaceProperty();
        corMinus = lpsPresets.getYMinusFaceProperty();
      }

      let axPlus, axMinus;
      if (axFlip) {
        axPlus = lpsPresets.getZMinusFaceProperty();
        axMinus = lpsPresets.getZPlusFaceProperty();
      } else {
        axPlus = lpsPresets.getZPlusFaceProperty();
        axMinus = lpsPresets.getZMinusFaceProperty();
      }

      if (sagPlane === 0) {
        this.axes.setXMinusFaceProperty(sagMinus);
        this.axes.setXPlusFaceProperty(sagPlus);
      } else if (corPlane === 0) {
        this.axes.setXMinusFaceProperty(corMinus);
        this.axes.setXPlusFaceProperty(corPlus);
      } else if (axPlane === 0) {
        this.axes.setXMinusFaceProperty(axMinus);
        this.axes.setXPlusFaceProperty(axPlus);
      }
      if (sagPlane === 1) {
        this.axes.setYMinusFaceProperty(sagMinus);
        this.axes.setYPlusFaceProperty(sagPlus);
      } else if (corPlane === 1) {
        this.axes.setYMinusFaceProperty(corMinus);
        this.axes.setYPlusFaceProperty(corPlus);
      } else if (axPlane === 1) {
        this.axes.setYMinusFaceProperty(axMinus);
        this.axes.setYPlusFaceProperty(axPlus);
      }
      if (sagPlane === 2) {
        this.axes.setZMinusFaceProperty(sagMinus);
        this.axes.setZPlusFaceProperty(sagPlus);
      } else if (corPlane === 2) {
        this.axes.setZMinusFaceProperty(corMinus);
        this.axes.setZPlusFaceProperty(corPlus);
      } else if (axPlane === 2) {
        this.axes.setZMinusFaceProperty(axMinus);
        this.axes.setZPlusFaceProperty(axPlus);
      }

      window.addEventListener('resize', this.genericRenderWindow.resize);
      window.addEventListener('resize', this.orientationWidget.updateViewport);
    }

    // trigger pipeline update
    this.componentDidUpdate({});

    if (this.props.actors) {
      actors = actors.concat(this.props.actors);
    }

    this.renderer.resetCamera();
    this.renderer.updateLightsGeometryToFollowCamera();

    const svgWidgetManager = vtkSVGWidgetManager.newInstance();

    svgWidgetManager.setRenderer(this.renderer);
    svgWidgetManager.setScale(1);

    this.svgWidgetManager = svgWidgetManager;

    // TODO: Not sure why this is necessary to force the initial draw
    this.genericRenderWindow.resize();

    const boundAddSVGWidget = this.addSVGWidget.bind(this);
    const boundSetInteractorStyle = this.setInteractorStyle.bind(this);
    const boundGetApiProperty = this.getApiProperty.bind(this);
    const boundSetApiProperty = this.setApiProperty.bind(this);

    this.svgWidgets = {};

    if (this.props.onCreated) {
      /**
       * Note: The contents of this Object are
       * considered part of the API contract
       * we make with consumers of this component.
       */
      const api = {
        genericRenderWindow: this.genericRenderWindow,
        widgetManager: this.widgetManager,
        svgWidgetManager: this.svgWidgetManager,
        addSVGWidget: boundAddSVGWidget,
        setInteractorStyle: boundSetInteractorStyle,
        container: this.container.current,
        actors,
        svgWidgets: this.svgWidgets,
        get: boundGetApiProperty,
        set: boundSetApiProperty,
        type: 'VIEW3D',
        _component: this, // Backdoor still open for now whilst the API isn't as mature as View2D.
      };

      this.props.onCreated(api);
    }
  }

  componentDidUpdate(prevProps) {
    console.time('View3DMarchingCubes componentDidUpdate');
    if (prevProps.actors !== this.props.actors) {
      if (this.props.actors.length) {
        this.props.actors.forEach(this.renderer.addActor);
      } else {
        // TODO: Remove all actors
      }
      this.renderer
        .getActiveCamera()
        .set({ position: [0, -1, 0], viewUp: [0, 0, 1] });
      this.orientationWidget.setEnabled(true);
      this.orientationWidget.setViewportCorner(
        vtkOrientationMarkerWidget.Corners.BOTTOM_RIGHT
      );
      this.orientationWidget.setMinPixelSize(50);
      this.orientationWidget.setMaxPixelSize(500);
      this.renderWindow.render();
    }
    console.timeEnd('View3DMarchingCubes componentDidUpdate');
  }

  componentWillUnmount() {
    Object.keys(this.subs).forEach(k => {
      this.subs[k].unsubscribe();
    });

    if (this.props.onDestroyed) {
      this.props.onDestroyed();
    }

    this.genericRenderWindow.delete();
  }

  addSVGWidget(widget, name) {
    const { svgWidgetManager } = this;

    svgWidgetManager.addWidget(widget);
    svgWidgetManager.render();

    this.svgWidgets[name] = widget;
  }

  setInteractorStyle({ istyle, callbacks = {}, configuration = {} }) {
    const { actors } = this.props;
    const renderWindow = this.genericRenderWindow.getRenderWindow();
    const currentIStyle = renderWindow.getInteractor().getInteractorStyle();

    // unsubscribe from previous iStyle's callbacks.
    while (this.interactorStyleSubs.length) {
      this.interactorStyleSubs.pop().unsubscribe();
    }

    let currentViewport;
    if (currentIStyle.getViewport && istyle.getViewport) {
      currentViewport = currentIStyle.getViewport();
    }

    const interactor = renderWindow.getInteractor();

    interactor.setInteractorStyle(istyle);

    // TODO: Not sure why this is required the second time this function is called
    istyle.setInteractor(interactor);

    if (currentViewport) {
      istyle.setViewport(currentViewport);
    }

    if (istyle.getActor && istyle.getActor() !== actors[0]) {
      istyle.setActor(actors[0]);
    }

    // Add appropriate callbacks
    Object.keys(callbacks).forEach(key => {
      if (typeof istyle[key] === 'function') {
        const subscription = istyle[key](callbacks[key]);

        if (subscription && typeof subscription.unsubscribe === 'function') {
          this.interactorStyleSubs.push(subscription);
        }
      }
    });

    // Set Configuration
    if (configuration) {
      istyle.set(configuration);
    }

    renderWindow.render();
  }

  getApiProperty(propertyName) {
    return this.apiProperties[propertyName];
  }

  setApiProperty(propertyName, value) {
    this.apiProperties[propertyName] = value;
  }

  render() {
    if (!this.props.actors) {
      return null;
    }

    const style = { width: '100%', height: '100%', position: 'relative' };

    return (
      <div style={style}>
        <div ref={this.container} style={style} />
      </div>
    );
  }
}