#!/bin/bash

fs=`jq -r '.freesurfer' config.json`

source $FREESURFER_HOME/SetUpFreeSurfer.sh

mri_label2vol --seg $fs/mri/aparc+aseg.mgz --temp $fs/mri/aparc+aseg.mgz --regheader $fs/mri/aparc+aseg.mgz --o aparc+aseg.nii.gz
