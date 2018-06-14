# -*- coding: utf-8 -*-
"""
Created on Tue May  2 10:18:16 2017
@author: lindseykitchell
This is a function that takes in a binary nifti image and outputs a
.vtk surface mesh.
inputs:
img_path: path string to nifti image
surf_name: string of surface file name ending in .vtk
smooth_iter: number of smoothing iterations, default = 10
filetype: output file type, either vtk, ply or stl
Example:
import os
img_path = os.path.join('/Users/lindseykitchell/Box Sync/fiberVolumes/',
                        'HCP_105115_STREAM_Lmax8_conn6_boolVol_R_Arc.nii.gz')
niftiMask2Surface(img_path, "arc_smooth.vtk", 15, "vtk")
"""

import vtk

def niftiMask2Surface(label, img_path, surf_name, smooth_iter=10, filetype="vtk"):
    # import the binary nifti image
    reader = vtk.vtkNIFTIImageReader()
    reader.SetFileName(img_path)
    reader.Update()
    
    # do marching cubes to create a surface
    surface = vtk.vtkDiscreteMarchingCubes()
    surface.SetInputConnection(reader.GetOutputPort())
    # GenerateValues(number of surfaces, label range start, label range end)
    surface.GenerateValues(1, label, label)
    surface.Update()

    smoother = vtk.vtkWindowedSincPolyDataFilter()
    smoother.SetInputConnection(surface.GetOutputPort())
    smoother.SetNumberOfIterations(smooth_iter)
    smoother.NonManifoldSmoothingOn()
    smoother.NormalizeCoordinatesOn()
    smoother.Update()

    connectivityFilter = vtk.vtkPolyDataConnectivityFilter()
    connectivityFilter.SetInputConnection(smoother.GetOutputPort())
    connectivityFilter.SetExtractionModeToLargestRegion()
    connectivityFilter.Update()
    
    # Center the output data at 0 0 0
    untransform = vtk.vtkTransform()
    untransform.SetMatrix(reader.GetQFormMatrix())
    untransformFilter=vtk.vtkTransformPolyDataFilter()
    untransformFilter.SetTransform(untransform)
    untransformFilter.SetInputConnection(connectivityFilter.GetOutputPort())
    untransformFilter.Update()
    
    cleaned = vtk.vtkCleanPolyData()
    cleaned.SetInputConnection(untransformFilter.GetOutputPort())
    cleaned.Update()
    
    # doesn't work, but may need in future
    # close_holes = vtk.vtkFillHolesFilter()
    # close_holes.SetInputConnection(smoother.GetOutputPort())
    # close_holes.SetHoleSize(10)
    # close_holes.Update()
    if filetype == "stl":
      writer = vtk.vtkSTLWriter()
      writer.SetInputConnection(cleaned.GetOutputPort())
      writer.SetFileTypeToASCII()
      writer.SetFileName(surf_name)
      writer.Write()
      
    if filetype == "ply":
      writer = vtk.vtkPLYWriter()
      writer.SetInputConnection(cleaned.GetOutputPort())
      writer.SetFileTypeToASCII()
      writer.SetFileName(surf_name)
      writer.Write()
      
    if filetype == "vtk":
      writer = vtk.vtkPolyDataWriter()
      #writer = vtk.vtkDataSetWriter()
      writer.SetInputConnection(cleaned.GetOutputPort())
      writer.SetFileName(surf_name)
      writer.Write()