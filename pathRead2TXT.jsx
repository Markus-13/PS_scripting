/////////////////////*~*~*~	PS script by Markus_13 @ 2017.09.13 ~*~*~ v_0.6 ~*~*
////////////////////////////////////////////////////////////////////////////////
// Outputs point coordinates of currently selected path to .txt-file
//  (while holding SHIFT or CTRL - will output all the paths in the document)
//  (if can't read keys - the Yes/No dialog window will popup) 
////////////////////////////////////////////////////////////////////////////////

//for execution from OS
#target photoshop
//bring PS foreground
app.bringToFront();
//remember current measure units and change em to pixels
var strtRulerUnits = app.preferences.rulerUnits;
if (strtRulerUnits != Units.PIXELS){
  app.preferences.rulerUnits = Units.PIXELS;
}

//return current Path Index
function getPathIdx(){
  var ref = new ActionReference();
  ref.putProperty(charIDToTypeID("Prpr"), charIDToTypeID("TrgP"));
  ref.putEnumerated(charIDToTypeID("Dcmn"), charIDToTypeID("Ordn"), charIDToTypeID("Trgt"));
  var desc = executeActionGet(ref);
  return desc.getInteger(charIDToTypeID("TrgP"));
}

//return current Path Name
function getPathName(){
  var ref = new ActionReference();
  ref.putProperty(charIDToTypeID("Prpr"), charIDToTypeID("PthN"));
  ref.putEnumerated(charIDToTypeID('Path'), charIDToTypeID('Ordn'), charIDToTypeID('Trgt'));
  try{
    var desc = executeActionGet(ref);
  }
  catch(e){
    return '';
  }
  return desc.getString(charIDToTypeID("PthN"));
}

function arry2s(c){
	if((!c)||(!c.length)) return '[]';
	var i,r='[';
	for(i=0; i<c.length; i++) r+=c[i]+',';
	return r+']';
}
function coord2s(c){
	if((!c)||(!c.length)) return -1;
	return ''+parseInt(Math.floor(c[0]*10))*0.1+'*'+parseInt(Math.floor(c[1]*10))*0.1;
}

function enumStr(name,valz){
	var i,r=name+'={';
	if((valz)&&(valz.length)) for(i=0; i<valz.length; i++) r+=valz[i]+':"'+name+'.'+valz[i]+'",';
	return r+'}';
}

//reading Path to TX string
function readPath2Tx(p,tt){
	var tx = tt.tx;
	var js = tt.js;
	tx = tx+"\n\t_path_ \""+p.name+"\": \n";
	var o,h,n,i,e,t = p.subPathItems.length;
	js = js+' {typename:"PathItem", name:"'+p.name+'", kind:'+p.kind
+', subPathItems: {typename:"SubPathItems", length:'+t+", items:[\n";
	for(i=0; i<t; i++){
		o = p.subPathItems[i];
		e = o.pathPoints.length;
		tx = tx+"\t\toper:"+o.operation+', clzd:'+o.closed+', pnts:'+e+":\n";
		js = js+"\t/*i_"+i+':*/ {typename:"subPathItem", operation:'+o.operation+', closed:'+o.closed
+', pathPoints: {typename:"PathPoints", length:'+e+", items:[\n";
		o = o.pathPoints;
		for(n=0; n<e; n++){
			h = o[n];
			tx = tx+'•'+n+': kind:'+h.kind+', A:'+coord2s(h.anchor)+', L/i:'
+coord2s(h.leftDirection)+', R/o:'+coord2s(h.rightDirection)+"\n";
			js = js+"\t\t/*i_"+n+':*/ {typename:"PathPoint", kind:'+h.kind+', anchor:'+arry2s(h.anchor)
+', leftDirection:'+arry2s(h.leftDirection)+', rightDirection:'+arry2s(h.rightDirection)+"},\n";
		}
		js = js+"\t]}},\n";
	}
	tt.tx = tx;
	tt.js = (js+"]}},\n").replace(new RegExp('\\,\\]','g'),"]");
}
//_MAIN_FUNC____________________________________________________________________
function main(){
	//halt if no docs
	if(!documents.length) return;
	//get current document
	var ad = app.activeDocument;
	if(!ad) return;
	//get current path
	var p = ad.pathItems;
	if( (!p) || (!p.length) ){
		alert('No Paths found! We\'re stuck here, boss... (So Im leaving.)');
		return;
	}
	var fn = decodeURI(ad.name+'_PS_paths')+'.txt';
	var tx = {tx:'document_"'+ad.name+'"_PS_paths: '+"\n",js:''};
	var n,v = false;
	if(typeof(ScriptUI)!=='undefined'){
		v = (ScriptUI.environment.keyboardState.ctrlKey||ScriptUI.environment.keyboardState.shiftKey);
	}else{
		v = confirm("By default it will read only currently selected path.\n Should it read all paths?",true,'Paths2txt');
	}
	if(v){//if_Shift/Ctrl_held - read all paths:		
		for(n=0; n<p.length; n++) readPath2Tx(p[n],tx);
	}else{//otherwise get current path id		
		n = getPathIdx();
		if( (n<0) || (n>p.length) ) n=0;
		readPath2Tx(p[n],tx);
	}
	o = File(Folder.desktop+"/"+fn);
	o.open('w');
	o.writeln(tx.tx+"\n//_//_//_JS_c0De:\n"
+enumStr("PathKind",['CLIPPINGPATH','NORMALPATH','TEXTMASK','VECTORMASK','WORKPATH'])+";\n"
+enumStr("ShapeOperation",['SHAPEADD','SHAPEINTERSECT','SHAPESUBTRACT','SHAPEXOR'])+";\n"
+enumStr("PointKind",['CORNERPOINT','SMOOTHPOINT'])+";\n"
+"JSON_paths=[\n"+tx.js+"]\n");
	o.close();
	alert("Path Points were exported!\n"+decodeURI(fn));
}
main();

//revert measure units to saved
if(strtRulerUnits != app.preferences.rulerUnits)
{
  app.preferences.rulerUnits = strtRulerUnits;
}

//by Markus_13 {http://markus13.name/}
