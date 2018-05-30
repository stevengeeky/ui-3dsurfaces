'use strict';

(async _ => {
//

let config = window.config || window.parent.config;
if (!config) {
    let colors = await fetch('testdata/surfaces/color.json');
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
        ],
        colors
    };
}

console.log(config);

Vue.component("controller", {
    props: [ "meshes" ],
    data: function() {
        return {
            rotate: false,
            para3d: false,
            all: true,
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
    },
    template: `
        <div>
            <div class="control">
                <input type="checkbox" v-model="rotate"></input> Rotate</input>
                <input type="checkbox" v-model="para3d"></input> 3D</input>
            </div>
            <hr>
            <h3>Surfaces</h3>
            <div class="control">
                <input type="checkbox" v-model="all"></input> (All)</input>
            </div>
            <div class="control" v-for="_m in meshes">
                <input type="checkbox" v-model="_m.mesh.visible"></input> {{_m.name}}
            </div>
        </div>
    `,
});

/*
Vue.component("soichi", {
    data: function() {
        return {
            name: "soichi",
        }
    },
    template: `
        <b>{{name}}</b>
    `,
});
*/

function hashstring(s) {
    var h = 0, l = s.length, i = 0;
    if ( l > 0 )
        while (i < l)
            h = (h << 5) - h + s.charCodeAt(i++) | 0;
    return h;
}
var loader = new THREE.VTKLoader();

new Vue({
    el: "#app",
    template: `
        <div style="height: 100%; position: relative;">
            <controller v-if="controls" :meshes="meshes" @rotate="toggle_rotate()" id="controller" @para3d="set_para3d"/>
            <h2 id="loading" v-if="loaded < total_surfaces">Loading <small>({{round(loaded / total_surfaces)}}%)</small>...</h2>
            <div ref="main" class="main"></div>
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

            //loaded meshes
            meshes: [],
        }
    },
    mounted: function() {
        //TODO update to make it look like
        //view-source:https://threejs.org/examples/webgl_multiple_elements.html

        var width = this.$refs.main.clientWidth;
        var height = this.$refs.main.clientHeight;

        //init..
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x333333);
        //this.scene.fog = new THREE.Fog( 0x000000, 250, 1000 );

        //camera/renderer
        this.camera = new THREE.PerspectiveCamera( 45, width / height, 1, 5000);
        //this.renderer = new THREE.WebGLRenderer({alpha: true, antialias: true});
        this.renderer = new THREE.WebGLRenderer();

        //https://github.com/mrdoob/three.js/blob/master/examples/webgl_effects_parallaxbarrier.html
        this.effect = new THREE.ParallaxBarrierEffect( this.renderer );
        this.effect.setSize( width, height );
        
        this.$refs.main.append(this.renderer.domElement);
        this.camera.position.z = 200;
        this.scene.add(this.camera);

        //light
        var amblight = new THREE.AmbientLight(0xffffff, 0.3);
        this.scene.add(amblight);

        this.pointLight = new THREE.PointLight(0xffffff, 0.7);
        this.pointLight.position.set(-2000, 2000, -5000);
        this.scene.add(this.pointLight);
        
        //controls
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        /*
        this.controls.addEventListener('change', function(e) {
        });
        this.controls.addEventListener('start', function(){
        });
        */

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
            loader.load(surface.path, geometry=>{
                this.loaded++;
                this.add_surface(surface.name, geometry);
            });
        });
    },
    
    methods: {
        round: function(percentage) {
            return Math.round(percentage * 100);
        },
        
        resize: function() {
            var width = this.$refs.main.clientWidth;
            var height = this.$refs.main.clientHeight;

            this.camera.aspect = width / height;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(width, height);
            this.effect.setSize( width, height );
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
        },

        add_surface: function(name, geometry) {
            // console.log(name, geometry);

            //var scene = new THREE.Scene();
            //this.scene.add(this.camera);
            
            geometry.computeVertexNormals();
            //geometry.center();
            name = name.replace("_", " ");
            let hname = name.replace("Left", "");
            hname = hname.replace("Right", "");
            var hash = hashstring(hname);
            //var material = new THREE.MeshLambertMaterial({color: new THREE.Color(hash)}); 
            //var material = new THREE.MeshLambertMaterial({color: new THREE.Color(0x6666ff)}); 
            //var material = new THREE.MeshBasicMaterial({color: new THREE.Color(hash)});
            var material = new THREE.MeshPhongMaterial({color: new THREE.Color(hash)});
            var mesh = new THREE.Mesh(geometry, material);
            mesh.rotation.x += Math.PI / 2;

            mesh.position.x -= 100; //rigith/left
            mesh.position.y += 100; //s/i
            mesh.position.z -= 100; //a/p
            this.meshes.push({name, mesh});
            
            //scene.add(mesh);
            this.scene.add(mesh);

        },

        toggle_rotate: function() {
            this.controls.autoRotate = !this.controls.autoRotate;
        },
    },
});

})();