'use strict';

(async _ => {
//

let debounceUrl;
let vtkLoader = new THREE.VTKLoader();
let config = window.config || window.parent.config;

if (!config) {
    let colors = [];
    try {
        colors = await (await fetch('freesurfer/surfaces/color.json')).json();
    } catch (_) {}
    config = {
        //test data in case window.config isn't set (probably development?)
        surfaces: [
            { name: "3rd-Ventricle", path: "freesurfer/surfaces/3rd-Ventricle.vtk" },
            { name: "4th-Ventricle", path: "freesurfer/surfaces/4th-Ventricle.vtk" },
            { name: "Brain-Stem", path: "freesurfer/surfaces/Brain-Stem.vtk" },
            { name: "CC_Anterior", path: "freesurfer/surfaces/CC_Anterior.vtk" },
            { name: "CC_Central", path: "freesurfer/surfaces/CC_Central.vtk" },
            { name: "CC_Mid_Anterior", path: "freesurfer/surfaces/CC_Mid_Anterior.vtk" },
            { name: "CC_Mid_Posterior", path: "freesurfer/surfaces/CC_Mid_Posterior.vtk" },
            { name: "CC_Posterior", path: "freesurfer/surfaces/CC_Posterior.vtk" },
            { name: "ctx-lh-bankssts", path: "freesurfer/surfaces/ctx-lh-bankssts.vtk" },
            { name: "ctx-lh-caudalanteriorcingulate", path: "freesurfer/surfaces/ctx-lh-caudalanteriorcingulate.vtk" },
            { name: "ctx-lh-caudalmiddlefrontal", path: "freesurfer/surfaces/ctx-lh-caudalmiddlefrontal.vtk" },
            { name: "ctx-lh-cuneus", path: "freesurfer/surfaces/ctx-lh-cuneus.vtk" },
            { name: "ctx-lh-frontalpole", path: "freesurfer/surfaces/ctx-lh-frontalpole.vtk" },
            { name: "ctx-lh-fusiform", path: "freesurfer/surfaces/ctx-lh-fusiform.vtk" },
            { name: "ctx-lh-inferiorparietal", path: "freesurfer/surfaces/ctx-lh-inferiorparietal.vtk" },
            { name: "ctx-lh-inferiortemporal", path: "freesurfer/surfaces/ctx-lh-inferiortemporal.vtk" },
            { name: "ctx-lh-insula", path: "freesurfer/surfaces/ctx-lh-insula.vtk" },
            { name: "ctx-lh-lateraloccipital", path: "freesurfer/surfaces/ctx-lh-lateraloccipital.vtk" },
            { name: "ctx-lh-lateralorbitofrontal", path: "freesurfer/surfaces/ctx-lh-lateralorbitofrontal.vtk" },
            { name: "ctx-lh-lingual", path: "freesurfer/surfaces/ctx-lh-lingual.vtk" },
            { name: "ctx-lh-middletemporal", path: "freesurfer/surfaces/ctx-lh-middletemporal.vtk" },
            { name: "ctx-lh-paracentral", path: "freesurfer/surfaces/ctx-lh-paracentral.vtk" },
            { name: "ctx-lh-parahippocampal", path: "freesurfer/surfaces/ctx-lh-parahippocampal.vtk" },
            { name: "ctx-lh-parsopercularis", path: "freesurfer/surfaces/ctx-lh-parsopercularis.vtk" },
            { name: "ctx-lh-parsorbitalis", path: "freesurfer/surfaces/ctx-lh-parsorbitalis.vtk" },
            { name: "ctx-lh-parstriangularis", path: "freesurfer/surfaces/ctx-lh-parstriangularis.vtk" },
            { name: "ctx-lh-pericalcarine", path: "freesurfer/surfaces/ctx-lh-pericalcarine.vtk" },
            { name: "ctx-lh-postcentral", path: "freesurfer/surfaces/ctx-lh-postcentral.vtk" },
            { name: "ctx-lh-posteriorcingulate", path: "freesurfer/surfaces/ctx-lh-posteriorcingulate.vtk" },
            { name: "ctx-lh-precentral", path: "freesurfer/surfaces/ctx-lh-precentral.vtk" },
            { name: "ctx-lh-precuneus", path: "freesurfer/surfaces/ctx-lh-precuneus.vtk" },
            { name: "ctx-lh-rostralanteriorcingulate", path: "freesurfer/surfaces/ctx-lh-rostralanteriorcingulate.vtk" },
            { name: "ctx-lh-rostralmiddlefrontal", path: "freesurfer/surfaces/ctx-lh-rostralmiddlefrontal.vtk" },
            { name: "ctx-lh-superiorfrontal", path: "freesurfer/surfaces/ctx-lh-superiorfrontal.vtk" },
            { name: "ctx-lh-superiorparietal", path: "freesurfer/surfaces/ctx-lh-superiorparietal.vtk" },
            { name: "ctx-lh-superiortemporal", path: "freesurfer/surfaces/ctx-lh-superiortemporal.vtk" },
            { name: "ctx-lh-supramarginal", path: "freesurfer/surfaces/ctx-lh-supramarginal.vtk" },
            { name: "ctx-lh-temporalpole", path: "freesurfer/surfaces/ctx-lh-temporalpole.vtk" },
            { name: "ctx-lh-transversetemporal", path: "freesurfer/surfaces/ctx-lh-transversetemporal.vtk" },
            { name: "ctx-rh-bankssts", path: "freesurfer/surfaces/ctx-rh-bankssts.vtk" },
            { name: "ctx-rh-caudalanteriorcingulate", path: "freesurfer/surfaces/ctx-rh-caudalanteriorcingulate.vtk" },
            { name: "ctx-rh-caudalmiddlefrontal", path: "freesurfer/surfaces/ctx-rh-caudalmiddlefrontal.vtk" },
            { name: "ctx-rh-cuneus", path: "freesurfer/surfaces/ctx-rh-cuneus.vtk" },
            { name: "ctx-rh-frontalpole", path: "freesurfer/surfaces/ctx-rh-frontalpole.vtk" },
            { name: "ctx-rh-fusiform", path: "freesurfer/surfaces/ctx-rh-fusiform.vtk" },
            { name: "ctx-rh-inferiorparietal", path: "freesurfer/surfaces/ctx-rh-inferiorparietal.vtk" },
            { name: "ctx-rh-inferiortemporal", path: "freesurfer/surfaces/ctx-rh-inferiortemporal.vtk" },
            { name: "ctx-rh-insula", path: "freesurfer/surfaces/ctx-rh-insula.vtk" },
            { name: "ctx-rh-lateraloccipital", path: "freesurfer/surfaces/ctx-rh-lateraloccipital.vtk" },
            { name: "ctx-rh-lateralorbitofrontal", path: "freesurfer/surfaces/ctx-rh-lateralorbitofrontal.vtk" },
            { name: "ctx-rh-lingual", path: "freesurfer/surfaces/ctx-rh-lingual.vtk" },
            { name: "ctx-rh-middletemporal", path: "freesurfer/surfaces/ctx-rh-middletemporal.vtk" },
            { name: "ctx-rh-paracentral", path: "freesurfer/surfaces/ctx-rh-paracentral.vtk" },
            { name: "ctx-rh-parahippocampal", path: "freesurfer/surfaces/ctx-rh-parahippocampal.vtk" },
            { name: "ctx-rh-parsopercularis", path: "freesurfer/surfaces/ctx-rh-parsopercularis.vtk" },
            { name: "ctx-rh-parsorbitalis", path: "freesurfer/surfaces/ctx-rh-parsorbitalis.vtk" },
            { name: "ctx-rh-parstriangularis", path: "freesurfer/surfaces/ctx-rh-parstriangularis.vtk" },
            { name: "ctx-rh-pericalcarine", path: "freesurfer/surfaces/ctx-rh-pericalcarine.vtk" },
            { name: "ctx-rh-postcentral", path: "freesurfer/surfaces/ctx-rh-postcentral.vtk" },
            { name: "ctx-rh-posteriorcingulate", path: "freesurfer/surfaces/ctx-rh-posteriorcingulate.vtk" },
            { name: "ctx-rh-precentral", path: "freesurfer/surfaces/ctx-rh-precentral.vtk" },
            { name: "ctx-rh-precuneus", path: "freesurfer/surfaces/ctx-rh-precuneus.vtk" },
            { name: "ctx-rh-rostralanteriorcingulate", path: "freesurfer/surfaces/ctx-rh-rostralanteriorcingulate.vtk" },
            { name: "ctx-rh-rostralmiddlefrontal", path: "freesurfer/surfaces/ctx-rh-rostralmiddlefrontal.vtk" },
            { name: "ctx-rh-superiorfrontal", path: "freesurfer/surfaces/ctx-rh-superiorfrontal.vtk" },
            { name: "ctx-rh-superiorparietal", path: "freesurfer/surfaces/ctx-rh-superiorparietal.vtk" },
            { name: "ctx-rh-superiortemporal", path: "freesurfer/surfaces/ctx-rh-superiortemporal.vtk" },
            { name: "ctx-rh-supramarginal", path: "freesurfer/surfaces/ctx-rh-supramarginal.vtk" },
            { name: "ctx-rh-temporalpole", path: "freesurfer/surfaces/ctx-rh-temporalpole.vtk" },
            { name: "ctx-rh-transversetemporal", path: "freesurfer/surfaces/ctx-rh-transversetemporal.vtk" },
            { name: "Left-Amygdala", path: "freesurfer/surfaces/Left-Amygdala.vtk" },
            { name: "Left-Caudate", path: "freesurfer/surfaces/Left-Caudate.vtk" },
            { name: "Left-Cerebral-White-Matter", path: "freesurfer/surfaces/Left-Cerebral-White-Matter.vtk" },
            { name: "Left-Hippocampus", path: "freesurfer/surfaces/Left-Hippocampus.vtk" },
            { name: "Left-Lateral-Ventricle", path: "freesurfer/surfaces/Left-Lateral-Ventricle.vtk" },
            { name: "Left-Pallidum", path: "freesurfer/surfaces/Left-Pallidum.vtk" },
            { name: "Left-Putamen", path: "freesurfer/surfaces/Left-Putamen.vtk" },
            { name: "Left-Thalamus-Proper", path: "freesurfer/surfaces/Left-Thalamus-Proper.vtk" },
            { name: "Optic-Chiasm", path: "freesurfer/surfaces/Optic-Chiasm.vtk" },
            { name: "Right-Amygdala", path: "freesurfer/surfaces/Right-Amygdala.vtk" },
            { name: "Right-Caudate", path: "freesurfer/surfaces/Right-Caudate.vtk" },
            { name: "Right-Cerebral-White-Matter", path: "freesurfer/surfaces/Right-Cerebral-White-Matter.vtk" },
            { name: "Right-Hippocampus", path: "freesurfer/surfaces/Right-Hippocampus.vtk" },
            { name: "Right-Lateral-Ventricle", path: "freesurfer/surfaces/Right-Lateral-Ventricle.vtk" },
            { name: "Right-Pallidum", path: "freesurfer/surfaces/Right-Pallidum.vtk" },
            { name: "Right-Putamen", path: "freesurfer/surfaces/Right-Putamen.vtk" },
            { name: "Right-Thalamus-Proper", path: "freesurfer/surfaces/Right-Thalamus-Proper.vtk" }
        ]
    };
    let colorTable = {};
    colors.forEach(color => colorTable[color.name] = color);
    
    config.surfaces.forEach(surface => surface.color = (colorTable[surface.name] || {}).color);
}

Vue.component("controller", {
    props: [ "meshes", "visible" ],
    data: function() {
        return {
            rotate: false,
            para3d: false,
            all: true,
            
            niftis: [],
            selectedNifti: null,
            
            sortedMeshes: []
        }
    },
    
    watch: {
        all: function() {
            this.meshes.forEach(_m=>{
                _m.mesh.visible = this.all;
            });
        },
        rotate: function() {
            this.$emit('rotate');
        },
        para3d: function() {
            this.$emit('para3d', this.para3d);
        },
        meshes: function() {
            this.sortedMeshes = this.meshes.map(m => m).sort((a, b) => {
                let resBool = 0;
                if (a.display_name.startsWith("Right")) {
                    if (b.display_name.startsWith("Right")) resBool = a.display_name.substring(5) > b.display_name.substring(5);
                    else resBool = true;
                } else if (a.display_name.startsWith("Left")) {
                    if (b.display_name.startsWith("Left")) resBool = a.display_name.substring(4) > b.display_name.substring(4);
                    else resBool = !b.display_name.startsWith("Right");
                } else if (b.display_name.startsWith("Left") || b.display_name.startsWith("Right")) resBool = false;
                else {
                    resBool = a.display_name > b.display_name;
                }
                return resBool ? 1 : -1;
            });
        },
        selectedNifti: function(nifti) {
            if (typeof nifti == 'number') {
                this.$emit('overlay', this.niftis[nifti]);
            }
            else {
                this.$emit('overlay', null);
            }
        },
    },
    methods: {
        upload_file: function(e) {
            let file = e.target.files[0];
            let reader = new FileReader();
            reader.addEventListener('load', buffer=>{
                this.niftis.push({ user_uploaded: true, filename: file.name, buffer: reader.result });
                this.selectedNifti = this.niftis.length - 1;
            });
            reader.readAsArrayBuffer(file);
        },
    },
    
    template: `
        <div :class="{ 'controls': true, 'visible': visible }">
            <div class="control">
                <input type="checkbox" v-model="rotate"></input> Rotate</input>
                <input type="checkbox" v-model="para3d"></input> 3D</input>
            </div>
            <hr>
            <h3>Surfaces</h3>
            <div style="overflow-y:auto;overflow-x:hidden;max-height:48vh;">
                <div class="control">
                    <input type="checkbox" v-model="all"></input> (All)</input>
                </div>
                <div class="control" v-for="_m in sortedMeshes">
                    <input type="checkbox" v-model="_m.mesh.visible"></input> {{_m.display_name}}
                </div>
            </div>
            
            <div>
                <select v-if="niftis.length > 0" v-model="selectedNifti">
                    <option :value="null">(No Overlay)</option>
                    <option v-for="(n, i) in niftis" :value="i">{{n.filename}}</option>
                </select>
            </div>
            <div class="upload_div">
                <label for="upload_nifti">Upload Overlay Image (.nii.gz)</label>
                <input type="file" style="visibility:hidden;max-height:0;max-width:5px;" name="upload_nifti" id="upload_nifti" @change="upload_file"></input>
            </div>
        </div>
    `,
});

new Vue({
    el: "#app",
    template: `
        <div style="height: 100%; position: relative;">
            <controller v-if="controls" :meshes="meshes" :visible="controlsVisible" @rotate="toggle_rotate()" id="controller" @para3d="set_para3d" @overlay="overlay" />
            <h2 id="loading" v-if="loaded < total_surfaces">Loading <small>({{round(loaded / total_surfaces)}}%)</small>...</h2>
            <div ref="main" class="main"></div>
            <div ref="tinyBrain" class="tinyBrain"></div>
            <div class='show_hide_button' @click="controlsVisible = !controlsVisible">&#9776;</div>
        </div>
    `,
    components: [ "controller" ],
    data() {
        return {
            //var views = document.getElementById("views");
            //surfaces: [], //surface scenes
            loaded: 0,
            total_surfaces: config.surfaces.length,

            //main components
            effect: null,
            scene: null, 
            camera: null,
            renderer: null,
            controls: null,
            pointLight: null,
            
            tinyBrainScene: null,
            tinyBrainCam: null,
            brainRenderer: null,
            brainLight: null,
            
            controlsVisible: true,
            
            color_map: null,
            color_map_head: null,

            //loaded meshes
            meshes: [],
            stats: {
                max: null,
                min: null,
                
                sum: null,
                mean: null
            }
        }
    },
    mounted: function() {
        //tiny brain
        let loader = new THREE.ObjectLoader();
        loader.load('models/brain.json', _scene => {
            this.tinyBrainScene = _scene;
            let brainMesh = this.tinyBrainScene.children[1],
            unnecessaryDirectionalLight = this.tinyBrainScene.children[2];
            // align the tiny brain with the model displaying fascicles
            
            brainMesh.rotation.z -= Math.PI / 2;
            brainMesh.material = new THREE.MeshLambertMaterial({ color: 0xffcc99 });
            
            this.tinyBrainScene.remove(unnecessaryDirectionalLight);
            
            let amblight = new THREE.AmbientLight(0x101010);
            this.tinyBrainScene.add(amblight);
            
            this.brainLight = new THREE.PointLight(0xffffff, 1);
            this.brainLight.radius = 20;
            this.brainLight.position.copy(this.tinyBrainCam.position);
            this.tinyBrainScene.add(this.brainLight);
        });
        
        //TODO update to make it look like
        //view-source:https://threejs.org/examples/webgl_multiple_elements.html
        
        let vm = this;
        let width = this.$refs.main.clientWidth,
            height = this.$refs.main.clientHeight,
            tinyBrainWidth = this.$refs.tinyBrain.clientWidth,
            tinyBrainHeight = this.$refs.tinyBrain.clientHeight;

        //init..
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x333333);
        //this.scene.fog = new THREE.Fog( 0x000000, 250, 1000 );
        
        var axesHelper = new THREE.AxesHelper( 100 );
        this.scene.add( axesHelper );

        //camera/renderer
        this.camera = new THREE.PerspectiveCamera( 45, width / height, 1, 5000);
        this.tinyBrainCam = new THREE.PerspectiveCamera(45, tinyBrainWidth / tinyBrainHeight, 1, 5000);
        //this.renderer = new THREE.WebGLRenderer({alpha: true, antialias: true});
        this.renderer = new THREE.WebGLRenderer();
        this.brainRenderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });

        //https://github.com/mrdoob/three.js/blob/master/examples/webgl_effects_parallaxbarrier.html
        this.effect = new THREE.ParallaxBarrierEffect( this.renderer );
        this.effect.setSize( width, height );
        
        this.$refs.main.append(this.renderer.domElement);
        this.camera.position.z = 200;
        this.scene.add(this.camera);
        
        this.$refs.tinyBrain.appendChild(this.brainRenderer.domElement);
        
        //light
        var amblight = new THREE.AmbientLight(0xffffff, 0.3);
        this.scene.add(amblight);

        this.pointLight = new THREE.PointLight(0xffffff, 0.7);
        this.pointLight.position.set(-2000, 2000, -5000);
        this.scene.add(this.pointLight);
        
        //controls
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.addEventListener('change', e=>{
            let vm = this;
            let timeout = setTimeout(function() {
                if (timeout == debounceUrl) {
                    // rotation changes
                    let pan = vm.controls.getPanOffset();

                    // save camera information in url
                    let pos_params = [ vm.approx(vm.camera.position.x), vm.approx(vm.camera.position.y), vm.approx(vm.camera.position.z)].join(";");
                    let target_params = [ vm.approx(vm.controls.target.x), vm.approx(vm.controls.target.y), vm.approx(vm.controls.target.z)].join(";");
                    window.location = "#where=" + pos_params + "/" + target_params;
                }
            }, 700);
            debounceUrl = timeout;
        });
        this.controls.enableKeys = false;
        
        //url
        let info_string = getHashValue('where');
        if (info_string) {
            let info = info_string.split('/');
            let pos = (info[0] || '').split(';');
            let orig = (info[1] || '').split(';');

            if (pos) {
                this.camera.position.x = +pos[0];
                this.camera.position.y = +pos[1];
                this.camera.position.z = +pos[2];
            }
            if (orig) {
                this.controls.target.x = +orig[0];
                this.controls.target.y = +orig[1];
                this.controls.target.z = +orig[2];

                this.controls.setPubPanOffset(+orig[0], +orig[1], +orig[2]);
            }
        }

        window.addEventListener("resize", this.resize);
        this.resize();
        this.animate();

        /*
        //test
        var geometry = new THREE.BoxGeometry( 50, 50, 25 );
        var material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
        var cube = new THREE.Mesh( geometry, material );
        this.scene.add( cube );
        */

        //start loading surfaces geometries
        config.surfaces.forEach(surface=>{
            vtkLoader.load(surface.path, geometry=>{
                this.loaded++;
                this.add_surface(surface, geometry);
            });
        });
    },

    methods: {
        round: function(percentage) {
            return Math.round(percentage * 100);
        },
        approx: function(v) {
            return Math.round(v * 1e3) / 1e3;
        },

        resize: function() {
            let width = this.$refs.main.clientWidth,
                height = this.$refs.main.clientHeight,
                tinyBrainWidth = this.$refs.tinyBrain.clientWidth,
                tinyBrainHeight = this.$refs.tinyBrain.clientHeight;

            this.camera.aspect = width / height;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(width, height);
            this.effect.setSize( width, height );
            
            this.brainRenderer.setSize(tinyBrainWidth, tinyBrainHeight);
            this.tinyBrainCam.aspect = tinyBrainWidth / tinyBrainHeight;
            this.tinyBrainCam.updateProjectionMatrix();
        },

        set_para3d: function(it) {
            this.para3d = it;
        },

        animate: function() {
            requestAnimationFrame(this.animate);
            this.pointLight.position.copy(this.camera.position);
            this.controls.update();
            if(this.para3d) {
                this.effect.render(this.scene, this.camera);
            } else {
                this.renderer.render(this.scene, this.camera);
            }
            
            if (this.tinyBrainScene) {
                // normalize the main camera's position so that the tiny brain camera is always the same distance away from <0, 0, 0>
                let pan = this.controls.getPanOffset();
                let pos3 = new THREE.Vector3(
                        this.camera.position.x - pan.x,
                        this.camera.position.y - pan.y,
                        this.camera.position.z - pan.z
                        ).normalize();
                this.tinyBrainCam.position.set(pos3.x * 10, pos3.y * 10, pos3.z * 10);
                this.tinyBrainCam.rotation.copy(this.camera.rotation);

                this.brainLight.position.copy(this.tinyBrainCam.position);

                this.brainRenderer.clear();
                this.brainRenderer.render(this.tinyBrainScene, this.tinyBrainCam);
            }
        },
        
        overlay: function(nifti) {
            if (nifti) {
                let raw = pako.inflate(nifti.buffer);
                let N = niftijs.parse(raw);

                this.color_map_head = niftijs.parseHeader(raw);
                this.color_map = ndarray(N.data, N.sizes.slice().reverse());
                this.selectedNifti = nifti;
                
                N.data.forEach(v=>{
                    if (!isNaN(v)) {
                        if (this.stats.min == null) this.stats.min = v;
                        if (v < this.stats.min) this.stats.min = v;
                        
                        if (this.stats.max == null) this.stats.max = v;
                        if (v > this.stats.max) this.stats.max = v;
    
                        this.stats.sum += v;
                    }
                });
                this.stats.mean = this.stats.sum / N.data.length;
                // this.show_nifti(N.data);
            }
            else {
                this.color_map = null;
                this.color_map_head = null;
                this.selectedNifti = null;
            }

            // this.color_map.sum = 0;
            // this.dataMin = null;
            // this.dataMax = null;

            // //compute sdev
            // this.color_map.dsum = 0;
            // N.data.forEach(v=>{
            //     if (!isNaN(v)) {
            //         var d = v - this.color_map.mean;
            //         this.color_map.dsum += d*d;
            //     }
            // });
            // this.color_map.sdev = Math.sqrt(this.color_map.dsum/N.data.length);

            // //set min/max
            // this.sdev_m5 = this.color_map.mean - this.color_map.sdev*5;
            // this.sdev_5 = this.color_map.mean + this.color_map.sdev*5;

            // console.log("color map");
            // console.dir(color_map);
            
            this.meshes.forEach(object => {
                let mesh = object.mesh;
                let material = this.calculate_material(object.surface, mesh.geometry);
                mesh.material = material;
            });
        },
        
        show_nifti: function(data) {
            if (this.color_map) {
                let buckets = [];
                let num_buckets = 16;
                
                let originX = -this.color_map.shape[0] / 2;
                let originY = -this.color_map.shape[1] / 2;
                let originZ = -this.color_map.shape[2] / 2;
                if (this.color_map.spaceOrigin) {
                    originX = originX || this.color_map.spaceOrigin[0];
                    originY = originY || this.color_map.spaceOrigin[1];
                    originZ = originZ || this.color_map.spaceOrigin[2];
                }
                
                let scaleX = 1;
                let scaleY = 1;
                let scaleZ = 1;
                
                let box = new THREE.BoxGeometry(1, 1, 1);
                let boxMesh = new THREE.Mesh(box);
                let bucket, normalized_value;
                
                let tx;
                let ty;
                let tz;
                
                let tmpx, tmpy, tmpz;
                
                if (this.color_map.spaceOrigin) {
                    scaleX = scaleX || this.color_map_head.thicknesses[0];
                    scaleY = scaleY || this.color_map_head.thicknesses[1];
                    scaleZ = scaleZ || this.color_map_head.thicknesses[2];
                }
                
                for (let i = 0; i < num_buckets; i++) {
                    buckets.push(new THREE.Geometry());
                }
                
                for (let x = 0; x < this.color_map.shape[0]; x++) {
                    for (let y = 0; y <= this.color_map.shape[1]; y++) {
                        for (let z = 0; z < this.color_map.shape[2]; z++) {
                            let value = this.color_map.get(z, y, x);
                            if (typeof value == 'number' && value > 0) {
                                tx = x / this.color_map.shape[0] * 256 * scaleX - 128;
                                ty = y / this.color_map.shape[1] * 256 * scaleY - 128;
                                tz = z / this.color_map.shape[2] * 256 * scaleZ - 128;
                                
                                let angle = 90 * Math.PI / 180;
                                tmpy = ty * Math.cos(angle) - tz * Math.sin(angle);
                                tmpz = ty * Math.sin(angle) + tz * Math.cos(angle);
                                
                                normalized_value = (value - this.stats.min) / (this.stats.max - this.stats.min);
                                bucket = Math.round(normalized_value * (num_buckets - 1));
                                
                                buckets[bucket].vertices.push(new THREE.Vector3(tx, tmpy, tmpz));
                            }
                        }
                    }
                }
                
                // var material = new THREE.MeshPhongMaterial({color: 0xFF0000});
                // var mesh = new THREE.Mesh(singleGeometry, material);
                // scene.add(mesh);
                for (let i = 1; i < num_buckets; i++) {
                    let norm_i = i / num_buckets;
                    let material = new THREE.PointsMaterial({
                        color: new THREE.Color(norm_i, norm_i, norm_i),
                        size: 5,
                        // transparent: true,
                        // opacity: norm_i,
                    });
                    let points = new THREE.Points(buckets[i], material);
                    this.scene.add(points);
                }
            }
        },

        add_surface: function(surface, geometry) {
            //var scene = new THREE.Scene();
            //this.scene.add(this.camera);
            
            geometry.computeVertexNormals();
            //geometry.center();
            //var material = new THREE.MeshLambertMaterial({color: new THREE.Color(hash)}); 
            //var material = new THREE.MeshLambertMaterial({color: new THREE.Color(0x6666ff)}); 
            //var material = new THREE.MeshBasicMaterial({color: new THREE.Color(hash)});
            
            // let material = new THREE.ShaderMaterial({
            //     vertexShader,
            //     fragmentShader,
            //     uniforms: {
            //         "gamma": { value: 1 },
            //         "dataMax": { value: 1 },
            //     },
            //     transparent: true,
            //     depthTest: true,
            // });
            
            let material = this.calculate_material(surface, geometry);
            let mesh = new THREE.Mesh(geometry, material);
            
            let name = surface.name.replace("_", " ");
            
            this.meshes.push({surface, mesh, display_name: name});
            
            //scene.add(mesh);
            this.scene.add(mesh);
        },
        
        calculate_material: function(surface, geometry) {
            let colorValue = Math.abs(hashstring(surface.name.replace(/^(Left|Right)|\-rh\-|\-lh\-/g, ""))) % 0xffffff;
            
            if (!this.color_map) {
                return new THREE.MeshPhongMaterial({color: colorValue});
            }
            else {
                let vertexShader = `
                    attribute vec4 color;
                    varying vec4 vColor;

                    void main(){
                        vColor = color;
                        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                    }
                `;

                let fragmentShader = `
                    varying vec4 vColor;
                    uniform float dataMin;
                    uniform float dataMax;
                    uniform float gamma;

                    float transformify(float value) {
                        return pow(value / dataMax, 1.0 / gamma) * dataMax;
                    }

                    void main(){
                        gl_FragColor = vec4(transformify(vColor.r), transformify(vColor.g), transformify(vColor.b), vColor.a);
                    }
                `;
                
                let colors = [];
                let b = (colorValue & 255) / 255;
                let g = ((colorValue >> 8) & 255) / 255;
                let r = ((colorValue >> 16) & 255) / 255;
                
                let originX = -this.color_map.shape[0] / 2;
                let originY = -this.color_map.shape[1] / 2;
                let originZ = -this.color_map.shape[2] / 2;
                if (this.color_map.spaceOrigin) {
                    originX = originX || this.color_map.spaceOrigin[0];
                    originY = originY || this.color_map.spaceOrigin[1];
                    originZ = originZ || this.color_map.spaceOrigin[2];
                }
                
                let scaleX = 1;
                let scaleY = 1;
                let scaleZ = 1;
                
                let x, y, z, tx, ty, tz, tmpx, tmpy, tmpz;
                let angle;
                
                if (this.color_map.spaceOrigin) {
                    scaleX = scaleX || this.color_map_head.thicknesses[0];
                    scaleY = scaleY || this.color_map_head.thicknesses[1];
                    scaleZ = scaleZ || this.color_map_head.thicknesses[2];
                }
                
                for (let i = 0; i < geometry.attributes.position.count; i++) {
                    x = geometry.attributes.position.array[i * 3];
                    y = geometry.attributes.position.array[i * 3 + 1];
                    z = geometry.attributes.position.array[i * 3 + 2];
                    
                    // colors.push(r / 255);
                    // colors.push(g / 255);
                    // colors.push(b / 255);
                    
                    // angle = -90 * Math.PI / 180;
                    // tx = x;
                    // ty = y * Math.cos(angle) - z * Math.sin(angle);
                    // tz = y * Math.sin(angle) + z * Math.cos(angle);
                    tx = x;
                    ty = y;
                    tz = z;
                    
                    tx = Math.round((tx + 128) / 256 * this.color_map.shape[0] * scaleX);
                    ty = Math.round((ty + 128) / 256 * this.color_map.shape[1] * scaleY);
                    tz = Math.round((tz + 128) / 256 * this.color_map.shape[2] * scaleZ);
                    
                    let v = this.color_map.get(tx, ty, tz);
                    
                    if (typeof value == 'number') {
                        colors.push(.5);
                        colors.push(.5);
                        colors.push(.5);
                        colors.push(1);
                    }
                    else {
                        let normalized_v = (v - this.stats.min) / (this.stats.max - this.stats.min);
                        
                        colors.push(normalized_v * r);
                        colors.push(normalized_v * g);
                        colors.push(normalized_v * b);
                        colors.push(Math.max(normalized_v, .3));
                    }
                }
                geometry.addAttribute('color', new THREE.BufferAttribute(new Float32Array(colors), 4) );
                
                return new THREE.ShaderMaterial({
                    vertexShader,
                    fragmentShader,
                    uniforms: {
                        "gamma": { value: 1.5 },
                        "dataMax": { value: this.stats.max },
                        "dataMin": { value: this.stats.min },
                    },
                    transparent: true,
                });
            }
        },

        toggle_rotate: function() {
            this.controls.autoRotate = !this.controls.autoRotate;
        },
    }
});

function getHashValue(key) {
    var matches = location.hash.match(new RegExp(key+'=([^&]*)'));
    return matches ? decodeURIComponent(matches[1]) : null;
}

function hashstring(s) {
    var h = 0, l = s.length, i = 0;
    if ( l > 0 )
        while (i < l)
            h = (h << 5) - h + s.charCodeAt(i++) | 0;
    return h;
}

})();