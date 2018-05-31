'use strict';

(async _ => {
//

let debounceUrl;
let vtkLoader = new THREE.VTKLoader();
let config = window.config || window.parent.config;

if (!config) {
    let colors = await (await fetch('testdata/surfaces/color.json')).json();
    config = {
        //test data in case window.config isn't set (probably development?)
        surfaces: [
            {name: "Callosum Forceps Major", path:"testdata/surfaces/Callosum_Forceps_Major_surf.vtk"},
            {name: "Callosum Forceps Minor", path:"testdata/surfaces/Callosum_Forceps_Minor_surf.vtk"},
            {name: "Left Arcuate", path:"testdata/surfaces/Left_Arcuate_surf.vtk"},
            {name: "Left Cingulum Cingulate", path:"testdata/surfaces/Left_Cingulum_Cingulate_surf.vtk"},
            {name: "Left Corticospinal", path:"testdata/surfaces/Left_Corticospinal_surf.vtk"},
            {name: "Left IFOF", path:"testdata/surfaces/Left_IFOF_surf.vtk"},
            {name: "Left ILF", path:"testdata/surfaces/Left_ILF_surf.vtk"},
            {name: "Left SLF", path:"testdata/surfaces/Left_SLF_surf.vtk"},
            {name: "Left Thalamic Radiation", path: "testdata/surfaces/Left_Thalamic_Radiation_surf.vtk"},
            {name: "Left Uncinate", path: "testdata/surfaces/Left_Uncinate_surf.vtk" },
            {name: "Right Arcuate", path: "testdata/surfaces/Right_Arcuate_surf.vtk "},
            {name: "Right Cingulum Cingulate", path: "testdata/surfaces/Right_Cingulum_Cingulate_surf.vtk" },
            {name: "Right Cingulum Hippocampus", path: "testdata/surfaces/Right_Cingulum_Hippocampus_surf.vtk" },
            {name: "Right Corticospinal", path: "testdata/surfaces/Right_Corticospinal_surf.vtk" },
            {name: "Right IFOF", path: "testdata/surfaces/Right_IFOF_surf.vtk" },
            {name: "Right ILF", path: "testdata/surfaces/Right_ILF_surf.vtk" },
            {name: "Right SLF", path: "testdata/surfaces/Right_SLF_surf.vtk" },
            {name: "Right Thalamic Radiation", path: "testdata/surfaces/Right_Thalamic_Radiation_surf.vtk" },
            {name: "Right Uncinate", path: "testdata/surfaces/Right_Uncinate_surf.vtk" },
        ]
    };
    let colorTable = {};
    colors.forEach(color => colorTable[color.name] = color);
    
    config.surfaces.forEach(surface => surface.color = colorTable[surface.name].color);
}

Vue.component("controller", {
    props: [ "meshes", "visible" ],
    data: function() {
        return {
            rotate: false,
            para3d: false,
            all: true,
            
            sortedMeshes: []
        }
    },
    methods: {
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
                if (a.name.startsWith("Right")) {
                    if (b.name.startsWith("Right")) resBool = a.name.substring(5) > b.name.substring(5);
                    else resBool = true;
                } else if (a.name.startsWith("Left")) {
                    if (b.name.startsWith("Left")) resBool = a.name.substring(4) > b.name.substring(4);
                    else resBool = !b.name.startsWith("Right");
                } else if (b.name.startsWith("Left") || b.name.startsWith("Right")) resBool = false;
                else {
                    resBool = a.name > b.name;
                }
                return resBool ? 1 : -1;
            });
        }
    },
    template: `
        <div :class="{ 'controls': true, 'visible': visible }">
            <div class="control">
                <input type="checkbox" v-model="rotate"></input> Rotate</input>
                <input type="checkbox" v-model="para3d"></input> 3D</input>
            </div>
            <hr>
            <h3>Surfaces</h3>
            <div class="control">
                <input type="checkbox" v-model="all"></input> (All)</input>
            </div>
            <div class="control" v-for="_m in sortedMeshes">
                <input type="checkbox" v-model="_m.mesh.visible"></input> {{_m.name}}
            </div>
        </div>
    `,
});

new Vue({
    el: "#app",
    template: `
        <div style="height: 100%; position: relative;">
            <controller v-if="controls" :meshes="meshes" :visible="controlsVisible" @rotate="toggle_rotate()" id="controller" @para3d="set_para3d"/>
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

            //loaded meshes
            meshes: [],
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

        add_surface: function(surface, geometry) {
            //var scene = new THREE.Scene();
            //this.scene.add(this.camera);
            
            geometry.computeVertexNormals();
            //geometry.center();
            //var material = new THREE.MeshLambertMaterial({color: new THREE.Color(hash)}); 
            //var material = new THREE.MeshLambertMaterial({color: new THREE.Color(0x6666ff)}); 
            //var material = new THREE.MeshBasicMaterial({color: new THREE.Color(hash)});
            if (!surface.color) surface.color = [1, 1, 1];
            let material = new THREE.MeshPhongMaterial({color: new THREE.Color(surface.color[0], surface.color[1], surface.color[2])});
            let mesh = new THREE.Mesh(geometry, material);
            mesh.rotation.x += Math.PI / 2;
            
            mesh.position.x -= 100; //rigith/left
            mesh.position.y += 100; //s/i
            mesh.position.z -= 100; //a/p
            
            let name = surface.name.replace("_", " ");
            this.meshes.push({name, mesh});
            
            //scene.add(mesh);
            this.scene.add(mesh);
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

})();