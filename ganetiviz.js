(function($){
  
  var Renderer = function(elt){
    // elt -> refers to an dom element.
    var dom = $(elt)

    var canvas = dom.get(0)

    // 2D Canvas Object
    var ctx = canvas.getContext("2d");

    // Graphics Object
    var gfx = arbor.Graphics(canvas)

    // sys -> refers to the Particle System
    var sys = null

    //(?)
    var _vignette = null
    var selected = null,
        nearest = null,
        _mouseP = null;

    
    //(?) What is that :o
    var that = {

      //The .init method will be called once before the first pass through the draw loop.
      init:function(pSystem){
        sys = pSystem
        sys.screen({
                    size: {width:dom.width(),height:dom.height()},
                    padding:[36,60,36,60]
                   })

        $(window).resize(that.resize)
        that.resize()
        that._initMouseHandling()
      },

      //(?)
      resize:function(){
        canvas.width = $(window).width()
        canvas.height = .75* $(window).height()
        sys.screen({size:{width:canvas.width, height:canvas.height}})
        _vignette = null
        that.redraw()
      },

      //Then the .redraw method will be called each time the screen needs to be re-plotted.
      redraw:function(){

        gfx.clear()
        sys.eachEdge(function(edge, p1, p2){
          if (edge.source.data.alpha * edge.target.data.alpha == 0) return
          gfx.line(p1, p2, {stroke:"#b2b19d", width:2, alpha:edge.target.data.alpha})
        })

        sys.eachNode(function(node, pt){
          var w = Math.max(20, 20+gfx.textWidth(node.name) )
          if (node.data.alpha===0) return
          if (node.data.shape=='dot'){
            gfx.oval(pt.x-w/2, pt.y-w/2, w, w, {fill:node.data.color, alpha:node.data.alpha})
            gfx.text(node.name, pt.x, pt.y+7, {color:"white", align:"center", font:"Arial", size:12})
            gfx.text(node.name, pt.x, pt.y+7, {color:"white", align:"center", font:"Arial", size:12})
          }else{
            gfx.rect(pt.x-w/2, pt.y-8, w, 20, 4, {fill:node.data.color, alpha:node.data.alpha})
            gfx.text(node.name, pt.x, pt.y+9, {color:"white", align:"center", font:"Arial", size:12})
            gfx.text(node.name, pt.x, pt.y+9, {color:"white", align:"center", font:"Arial", size:12})
          }
        })
        that._drawVignette()
      },
      

      _drawVignette:function(){
        var w = canvas.width
        var h = canvas.height
        var r = 20

        if (!_vignette){
          var top = ctx.createLinearGradient(0,0,0,r)
          top.addColorStop(0, "#e0e0e0")
          top.addColorStop(.7, "rgba(255,255,255,0)")

          var bot = ctx.createLinearGradient(0,h-r,0,h)
          bot.addColorStop(0, "rgba(255,255,255,0)")
          bot.addColorStop(1, "white")

          _vignette = {top:top, bot:bot}
        }
        
        // top
        ctx.fillStyle = _vignette.top
        ctx.fillRect(0,0, w,r)

        // bot
        ctx.fillStyle = _vignette.bot
        ctx.fillRect(0,h-r, w,r)
      },

      /*
      switchMode:function(e){
        if (e.mode=='hidden'){
          dom.stop(true).fadeTo(e.dt,0, function(){
            if (sys) sys.stop()
            $(this).hide()
          })
        }else if (e.mode=='visible'){
          dom.stop(true).css('opacity',0).show().fadeTo(e.dt,1,function(){
            that.resize()
          })
          if (sys) sys.start()
        }
      },
      */

      switchSection:function(newSection){
        var parent = sys.getEdgesFrom(newSection)[0].source
        var children = $.map(sys.getEdgesFrom(newSection), function(edge){
          return edge.target
        })
        sys.eachNode(function(node){
          if (node.data.shape=='dot') return // skip all but leafnodes

          var nowVisible = ($.inArray(node, children)>=0)
          var newAlpha = (nowVisible) ? 1 : 0

          // dt is the Duration for the tweening process.
          var dt = (nowVisible) ? .5 : .5

          // http://www.webopedia.com/TERM/T/tweening.html
          sys.tweenNode(node, dt, {alpha:newAlpha})

          if (newAlpha==1){
            node.p.x = parent.p.x + .05*Math.random() - .025
            node.p.y = parent.p.y + .05*Math.random() - .025
            node.tempMass = .001
          }
        })
      },
     
      
      _initMouseHandling:function(){
        // no-nonsense drag and drop (thanks springy.js)
        selected = null;
        nearest = null;
        var dragged = null;
        var oldmass = 1

        var _section = null

        // Handler Object for various types of mouse events. (mousemove, mouseup, click)
        var handler = {
          moved:function(e){
            var pos = $(canvas).offset();
            _mouseP = arbor.Point(e.pageX-pos.left, e.pageY-pos.top)
            nearest = sys.nearest(_mouseP);

            if (!nearest.node) return false

            
            if (nearest.node.data.shape!='dot'){
              selected = (nearest.distance < 50) ? nearest : null
              if (selected){
                 dom.addClass('linkable')
                 // window.status = selected.node.data.link.replace(/^\//,"http://"+window.location.host+"/").replace(/^#/,'')
              }
              else{
                 dom.removeClass('linkable')
                 window.status = ''
              }
            }else if ($.inArray(nearest.node.name, ['node1.example.com','node2.example.com','node3.example.com','node4.example.com','node5.example.com',]) >=0 ){
              if (nearest.node.name!=_section){
                _section = nearest.node.name
                that.switchSection(_section)
              }
              dom.removeClass('linkable')
              window.status = ''
            }
            
            
            return false
          },

          clicked:function(e){
            var pos = $(canvas).offset();
            _mouseP = arbor.Point(e.pageX-pos.left, e.pageY-pos.top)
            nearest = dragged = sys.nearest(_mouseP);
            
            if (nearest && selected && nearest.node===selected.node){
              var link = selected.node.data.link
              if (link.match(/^#/)){
                 $(that).trigger({type:"navigate", path:link.substr(1)})
              }else{
                 window.location = link
              }
              return false
            }
            
            if (dragged && dragged.node !== null) dragged.node.fixed = true

            $(canvas).unbind('mousemove', handler.moved);
            $(canvas).bind('mousemove', handler.dragged)
            $(window).bind('mouseup', handler.dropped)

            return false
          },

          dragged:function(e){
            var old_nearest = nearest && nearest.node._id
            var pos = $(canvas).offset();
            var s = arbor.Point(e.pageX-pos.left, e.pageY-pos.top)

            if (!nearest) return
            if (dragged !== null && dragged.node !== null){
              var p = sys.fromScreen(s)
              dragged.node.p = p
            }

            return false
          },

          dropped:function(e){
            if (dragged===null || dragged.node===undefined) return
            if (dragged.node !== null) dragged.node.fixed = false
            dragged.node.tempMass = 1000
            dragged = null;
            // selected = null
            $(canvas).unbind('mousemove', handler.dragged)
            $(window).unbind('mouseup', handler.dropped)
            $(canvas).bind('mousemove', handler.moved);
            _mouseP = null
            return false
          }

        }

        $(canvas).mousedown(handler.clicked);
        $(canvas).mousemove(handler.moved);

      }
    }
    
    return that
  }
  
  /*
  var Nav = function(elt){
    var dom = $(elt)
    var _path = null
    // <Removed_Some_Code: Check backup copy>
  }
  */

  $(document).ready(function(){
    var CLR = {
      branch:"#b2b19d",
      ganetinode:"orange",
      ganetivm:"#922E00",
      ganetinodegroup:"#a7af00"
    }

    var theGraph = {
  nodes:{
        "node1.example.com":{color:CLR.ganetinode, shape:"dot", alpha:1},
        "instance55.example.com":{color:CLR.ganetivm, alpha:0},
        "instance45.example.com":{color:CLR.ganetivm, alpha:0},
        "instance10.example.com":{color:CLR.ganetivm, alpha:0},
        "instance56.example.com":{color:CLR.ganetivm, alpha:0},
        "instance109.example.com":{color:CLR.ganetivm, alpha:0},
        "instance8.example.com":{color:CLR.ganetivm, alpha:0},
        "instance74.example.com":{color:CLR.ganetivm, alpha:0},
        "instance80.example.com":{color:CLR.ganetivm, alpha:0},
        "instance85.example.com":{color:CLR.ganetivm, alpha:0},
        "instance100.example.com":{color:CLR.ganetivm, alpha:0},
        "instance70.example.com":{color:CLR.ganetivm, alpha:0},
        "instance52.example.com":{color:CLR.ganetivm, alpha:0},
        "instance27.example.com":{color:CLR.ganetivm, alpha:0},
        "instance46.example.com":{color:CLR.ganetivm, alpha:0},
        "instance24.example.com":{color:CLR.ganetivm, alpha:0},
        "instance65.example.com":{color:CLR.ganetivm, alpha:0},
        "instance58.example.com":{color:CLR.ganetivm, alpha:0},
        "instance2.example.com":{color:CLR.ganetivm, alpha:0},
        "instance53.example.com":{color:CLR.ganetivm, alpha:0},
        "instance44.example.com":{color:CLR.ganetivm, alpha:0},

        "node2.example.com":{color:CLR.ganetinode, shape:"dot", alpha:1},
        "instance19.example.com":{color:CLR.ganetivm, alpha:0},
        "instance13.example.com":{color:CLR.ganetivm, alpha:0},
        "instance99.example.com":{color:CLR.ganetivm, alpha:0},
        "instance62.example.com":{color:CLR.ganetivm, alpha:0},
        "instance38.example.com":{color:CLR.ganetivm, alpha:0},
        "instance105.example.com":{color:CLR.ganetivm, alpha:0},
        "instance32.example.com":{color:CLR.ganetivm, alpha:0},
        "instance37.example.com":{color:CLR.ganetivm, alpha:0},
        "instance1.example.com":{color:CLR.ganetivm, alpha:0},
        "instance25.example.com":{color:CLR.ganetivm, alpha:0},
        "instance94.example.com":{color:CLR.ganetivm, alpha:0},
        "instance95.example.com":{color:CLR.ganetivm, alpha:0},
        "instance12.example.com":{color:CLR.ganetivm, alpha:0},
        "instance89.example.com":{color:CLR.ganetivm, alpha:0},
        "instance61.example.com":{color:CLR.ganetivm, alpha:0},
        "instance49.example.com":{color:CLR.ganetivm, alpha:0},
        "instance83.example.com":{color:CLR.ganetivm, alpha:0},
        "instance87.example.com":{color:CLR.ganetivm, alpha:0},
        "instance90.example.com":{color:CLR.ganetivm, alpha:0},
        "instance36.example.com":{color:CLR.ganetivm, alpha:0},
        "instance18.example.com":{color:CLR.ganetivm, alpha:0},
        "instance7.example.com":{color:CLR.ganetivm, alpha:0},
        "instance39.example.com":{color:CLR.ganetivm, alpha:0},
        "instance40.example.com":{color:CLR.ganetivm, alpha:0},
        "instance4.example.com":{color:CLR.ganetivm, alpha:0},

        "node3.example.com":{color:CLR.ganetinode, shape:"dot", alpha:1},
        "instance16.example.com":{color:CLR.ganetivm, alpha:0},
        "instance102.example.com":{color:CLR.ganetivm, alpha:0},
        "instance41.example.com":{color:CLR.ganetivm, alpha:0},
        "instance67.example.com":{color:CLR.ganetivm, alpha:0},
        "instance104.example.com":{color:CLR.ganetivm, alpha:0},
        "instance34.example.com":{color:CLR.ganetivm, alpha:0},
        "instance75.example.com":{color:CLR.ganetivm, alpha:0},
        "instance50.example.com":{color:CLR.ganetivm, alpha:0},
        "instance51.example.com":{color:CLR.ganetivm, alpha:0},
        "instance23.example.com":{color:CLR.ganetivm, alpha:0},
        "instance54.example.com":{color:CLR.ganetivm, alpha:0},
        "instance26.example.com":{color:CLR.ganetivm, alpha:0},
        "instance21.example.com":{color:CLR.ganetivm, alpha:0},
        "instance63.example.com":{color:CLR.ganetivm, alpha:0},
        "instance22.example.com":{color:CLR.ganetivm, alpha:0},
        "instance14.example.com":{color:CLR.ganetivm, alpha:0},
        "instance81.example.com":{color:CLR.ganetivm, alpha:0},
        "instance17.example.com":{color:CLR.ganetivm, alpha:0},
        "instance101.example.com":{color:CLR.ganetivm, alpha:0},
        "instance28.example.com":{color:CLR.ganetivm, alpha:0},

        "node4.example.com":{color:CLR.ganetinode, shape:"dot", alpha:1},
        "instance43.example.com":{color:CLR.ganetivm, alpha:0},
        "instance107.example.com":{color:CLR.ganetivm, alpha:0},
        "instance82.example.com":{color:CLR.ganetivm, alpha:0},
        "instance57.example.com":{color:CLR.ganetivm, alpha:0},
        "instance97.example.com":{color:CLR.ganetivm, alpha:0},
        "instance48.example.com":{color:CLR.ganetivm, alpha:0},
        "instance31.example.com":{color:CLR.ganetivm, alpha:0},
        "instance76.example.com":{color:CLR.ganetivm, alpha:0},
        "instance66.example.com":{color:CLR.ganetivm, alpha:0},
        "instance29.example.com":{color:CLR.ganetivm, alpha:0},
        "instance71.example.com":{color:CLR.ganetivm, alpha:0},
        "instance33.example.com":{color:CLR.ganetivm, alpha:0},
        "instance11.example.com":{color:CLR.ganetivm, alpha:0},
        "instance60.example.com":{color:CLR.ganetivm, alpha:0},
        "instance30.example.com":{color:CLR.ganetivm, alpha:0},
        "instance106.example.com":{color:CLR.ganetivm, alpha:0},
        "instance35.example.com":{color:CLR.ganetivm, alpha:0},
        "instance78.example.com":{color:CLR.ganetivm, alpha:0},

        "node5.example.com":{color:CLR.ganetinode, shape:"dot", alpha:1},
        "instance72.example.com":{color:CLR.ganetivm, alpha:0},
        "instance73.example.com":{color:CLR.ganetivm, alpha:0},
        "instance79.example.com":{color:CLR.ganetivm, alpha:0},
        "instance108.example.com":{color:CLR.ganetivm, alpha:0},
        "instance42.example.com":{color:CLR.ganetivm, alpha:0},
        "instance92.example.com":{color:CLR.ganetivm, alpha:0},
        "instance20.example.com":{color:CLR.ganetivm, alpha:0},
        "instance88.example.com":{color:CLR.ganetivm, alpha:0},
        "instance110.example.com":{color:CLR.ganetivm, alpha:0},
        "instance96.example.com":{color:CLR.ganetivm, alpha:0},
        "instance93.example.com":{color:CLR.ganetivm, alpha:0},
        "instance6.example.com":{color:CLR.ganetivm, alpha:0},
        "instance5.example.com":{color:CLR.ganetivm, alpha:0},
        "instance77.example.com":{color:CLR.ganetivm, alpha:0},
        "instance98.example.com":{color:CLR.ganetivm, alpha:0},
        "instance86.example.com":{color:CLR.ganetivm, alpha:0},
        "instance69.example.com":{color:CLR.ganetivm, alpha:0},
        "instance84.example.com":{color:CLR.ganetivm, alpha:0},
        "instance103.example.com":{color:CLR.ganetivm, alpha:0},
        "instance64.example.com":{color:CLR.ganetivm, alpha:0},
        "instance3.example.com":{color:CLR.ganetivm, alpha:0},
        "instance15.example.com":{color:CLR.ganetivm, alpha:0},
        "instance91.example.com":{color:CLR.ganetivm, alpha:0},
        "instance68.example.com":{color:CLR.ganetivm, alpha:0},
        "instance59.example.com":{color:CLR.ganetivm, alpha:0},
        "instance9.example.com":{color:CLR.ganetivm, alpha:0},
        "instance47.example.com":{color:CLR.ganetivm, alpha:0},
        },

      edges:{
        "node1.example.com":{
	        "instance55.example.com":{length:4},
	        "instance45.example.com":{length:4},
	        "instance10.example.com":{length:4},
	        "instance56.example.com":{length:4},
	        "instance109.example.com":{length:4},
	        "instance8.example.com":{length:4},
	        "instance74.example.com":{length:4},
	        "instance80.example.com":{length:4},
	        "instance85.example.com":{length:4},
	        "instance100.example.com":{length:4},
	        "instance70.example.com":{length:4},
	        "instance52.example.com":{length:4},
	        "instance27.example.com":{length:4},
	        "instance46.example.com":{length:4},
	        "instance24.example.com":{length:4},
	        "instance65.example.com":{length:4},
	        "instance58.example.com":{length:4},
	        "instance2.example.com":{length:4},
	        "instance53.example.com":{length:4},
	        "instance44.example.com":{length:4},
        },
        "node2.example.com":{
	        "instance19.example.com":{length:4},
	        "instance13.example.com":{length:4},
	        "instance99.example.com":{length:4},
	        "instance62.example.com":{length:4},
	        "instance38.example.com":{length:4},
	        "instance105.example.com":{length:4},
	        "instance32.example.com":{length:4},
	        "instance37.example.com":{length:4},
	        "instance1.example.com":{length:4},
	        "instance25.example.com":{length:4},
	        "instance94.example.com":{length:4},
	        "instance95.example.com":{length:4},
	        "instance12.example.com":{length:4},
	        "instance89.example.com":{length:4},
	        "instance61.example.com":{length:4},
	        "instance49.example.com":{length:4},
	        "instance83.example.com":{length:4},
	        "instance87.example.com":{length:4},
	        "instance90.example.com":{length:4},
	        "instance36.example.com":{length:4},
	        "instance18.example.com":{length:4},
	        "instance7.example.com":{length:4},
	        "instance39.example.com":{length:4},
	        "instance40.example.com":{length:4},
	        "instance4.example.com":{length:4},
        },
        "node3.example.com":{
	        "instance16.example.com":{length:4},
	        "instance102.example.com":{length:4},
	        "instance41.example.com":{length:4},
	        "instance67.example.com":{length:4},
	        "instance104.example.com":{length:4},
	        "instance34.example.com":{length:4},
	        "instance75.example.com":{length:4},
	        "instance50.example.com":{length:4},
	        "instance51.example.com":{length:4},
	        "instance23.example.com":{length:4},
	        "instance54.example.com":{length:4},
	        "instance26.example.com":{length:4},
	        "instance21.example.com":{length:4},
	        "instance63.example.com":{length:4},
	        "instance22.example.com":{length:4},
	        "instance14.example.com":{length:4},
	        "instance81.example.com":{length:4},
	        "instance17.example.com":{length:4},
	        "instance101.example.com":{length:4},
	        "instance28.example.com":{length:4},
        },
        "node4.example.com":{
	        "instance43.example.com":{length:4},
	        "instance107.example.com":{length:4},
	        "instance82.example.com":{length:4},
	        "instance57.example.com":{length:4},
	        "instance97.example.com":{length:4},
	        "instance48.example.com":{length:4},
	        "instance31.example.com":{length:4},
	        "instance76.example.com":{length:4},
	        "instance66.example.com":{length:4},
	        "instance29.example.com":{length:4},
	        "instance71.example.com":{length:4},
	        "instance33.example.com":{length:4},
	        "instance11.example.com":{length:4},
	        "instance60.example.com":{length:4},
	        "instance30.example.com":{length:4},
	        "instance106.example.com":{length:4},
	        "instance35.example.com":{length:4},
	        "instance78.example.com":{length:4},
        },
        "node5.example.com":{
	        "instance72.example.com":{length:4},
	        "instance73.example.com":{length:4},
	        "instance79.example.com":{length:4},
	        "instance108.example.com":{length:4},
	        "instance42.example.com":{length:4},
	        "instance92.example.com":{length:4},
	        "instance20.example.com":{length:4},
	        "instance88.example.com":{length:4},
	        "instance110.example.com":{length:4},
	        "instance96.example.com":{length:4},
	        "instance93.example.com":{length:4},
	        "instance6.example.com":{length:4},
	        "instance5.example.com":{length:4},
	        "instance77.example.com":{length:4},
	        "instance98.example.com":{length:4},
	        "instance86.example.com":{length:4},
	        "instance69.example.com":{length:4},
	        "instance84.example.com":{length:4},
	        "instance103.example.com":{length:4},
	        "instance64.example.com":{length:4},
	        "instance3.example.com":{length:4},
	        "instance15.example.com":{length:4},
	        "instance91.example.com":{length:4},
	        "instance68.example.com":{length:4},
	        "instance59.example.com":{length:4},
	        "instance9.example.com":{length:4},
	        "instance47.example.com":{length:4},
        },
      }
    }

    var sys = arbor.ParticleSystem()
    sys.parameters({stiffness:900, repulsion:2000, gravity:true, dt:0.015})
    sys.renderer = Renderer("#grapharea")
    sys.graft(theGraph)
    
  })
})(this.jQuery)
