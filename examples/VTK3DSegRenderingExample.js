import React, { Component } from 'react'

import * as cornerstone from 'cornerstone-core'
import * as dicomParser from 'dicom-parser'
import * as cornerstoneWADOImageLoader from 'cornerstone-wado-image-loader'

import vtkFullScreenRenderWindow from 'vtk.js/Sources/Rendering/Misc/FullScreenRenderWindow'
import vtkImageData from 'vtk.js/Sources/Common/DataModel/ImageData'
import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray'
import vtkImageMapper from 'vtk.js/Sources/Rendering/Core/ImageMapper'
import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor'
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper'
import vtkImageMarchingCubes from 'vtk.js/Sources/Filters/General/ImageMarchingCubes'
import vtkSphere from 'vtk.js/Sources/Common/DataModel/Sphere'
import vtkSampleFunction from 'vtk.js/Sources/Imaging/Hybrid/SampleFunction'
import vtkITKHelper from 'vtk.js/Sources/Common/DataModel/ITKHelper'

import readImageDICOMFileSeries from 'itk/readImageDICOMFileSeries'


cornerstoneWADOImageLoader.external.cornerstone = cornerstone
cornerstoneWADOImageLoader.external.dicomParser = dicomParser

console.log('')
console.log('Page Reload')
console.log('')

async function downloadScan(url){

}

class ITKToVtk extends Component {

  async componentDidMount(){
    var files = []
    for (let i = 0; i < 87; i++){
      let url = `${window.location.href}/../dicoms/${i}.dcm`
      let response = await fetch(url)
      let blob = await response.blob()
      files.push(blob)
    }
    image = await readImageDICOMFileSeries(files)

    const itkImageData = vtkITKHelper.convertItkToVtkImage(image)

  }

  render(){
    return (
      <div></div>
    )
  }
}

export default ITKToVtk;
var scans = []

/*
console.log('Loading DICOM images...')
for (let i = 0; i < 87; i++){
  let url = `wadouri:${window.location.href}/../dicoms/${i}.dcm`
  scans.push(cornerstone.loadImage(url))
}
scans = await Promise.all(scans)

var scanPixelData = []
scans[0].getPixelData().map(x => scanPixelData.push(x))
scans[1].getPixelData().map(x => scanPixelData.push(x))
scanPixelData = new Uint16Array(50 * 50 * 50)
scanPixelData = scanPixelData.map(x => {return 1})
/*for (let i = 0; i < 2; i ++){
  let image = scans[i]
  let pixelData = image.getPixelData()
  pixelData = pixelData.map(p => {return ((p - image.minPixelValue) / image.maxPixelValue) * 255})
  scanPixelData += pixelData
}*/

/*

    const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance()
    const renderer = fullScreenRenderer.getRenderer()
    const renderWindow = fullScreenRenderer.getRenderWindow()

    const imageData = vtkImageData.newInstance()
    const dataArray = vtkDataArray.newInstance({
      numberOfComponents: 1,
      values: scanPixelData
    })

    imageData.setDimensions([50, 50, 50])
    imageData.getPointData().setScalars(dataArray)

    const sphere = vtkSphere.newInstance({ center: [0.0, 0.0, 0.0], radius: 0.5})
    const sample = vtkSampleFunction.newInstance({
      implicitFunction: sphere,
      sampleDimensions: [50, 50, 50],
      modelBounds: [-0.5, 0.5, -0.5, 0.5, -0.5, 0.5]
    })

    console.log({
      dataArray,
      imageData,
      sphere,
      sample,
      sampleData: sample.getOutputData().getPointData().getScalars().getData(),
      sampleRange: sample.getOutputData().getPointData().getScalars().getRange(),
      imageDataData: imageData.getPointData().getScalars().getData(),
    })

    const marchingCubes = vtkImageMarchingCubes.newInstance({ contourValue: 1, computeNormals: false, mergePoints: false })
    const actor = vtkActor.newInstance()
    const imageMapper = vtkMapper.newInstance()

    console.log('Running Marching Cubes...')
    marchingCubes.setInputData(imageData)
    actor.setMapper(imageMapper)
    imageMapper.setInputConnection(sample.getOutputPort())

    console.log('Rendering...')
    renderer.addActor(actor)
    renderer.resetCamera()
    renderWindow.render()
*/
