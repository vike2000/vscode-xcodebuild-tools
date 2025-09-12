	; /** pipe-thru tagged template-function, for eg html`<br/>` @ vscode: @ext:bierner.lit-html cf @ext:bierner.comment-tagged-templates & yet to try @ext:styled-components.vscode-styled-components //cspell:ignore bierner
		*/	function	html(strings,value___){var r=strings[0].trimEnd(),A=[].slice.call(arguments,1);for(var a in A)r+=A[a]+strings[+a+1].trimStart();return r}
	
	;var																					app = {} // container for Object.defineProperty for getters and setters
	
	// a regex to find significant numbers: ((\b\d*)?\.\d+\b|\b\d+\b)(?<!\.0+\b|\b0*1\.0+\b|\b0*(0|1)\.0+\b|\b0*(0|1)\b)
	
	;								$b.keyWhole
		(	[	["+","-"									,(ev,char)=>{					app	.			z
					=						Math.min(Math.max(																				    1
							,																				z		+ (char=="-"?-1:1)	), 100000		)	}
				,"up","dn"									,(ev,char)=>{					app	.			 centerTranslate
					=	[																					 centerTranslate[0]
						,																					 centerTranslate[1]+(char=='ArrowDown'?-1:1)
						*																			10													]	}
				,"lt","rt"									,(ev,char)=>{					app	.			 centerTranslate
					=	[																					 centerTranslate[0]+(char=='ArrowLeft'?-1:1)
						*																			10
						,																					 centerTranslate[1]							]	}
				,"C"										,(ev,char)=>{					app	.			 centerTranslate=[0,0]
					;							redraw	()																									}
				,											 null			//			last		keyup
				,											 null			//before	any	truthy	keydown
//				,_.debounce									((ev,char)=>{	// after	any	truthy	keydown
//					;							redraw	()},500)
				,											 (ev,char)=>{	// after	any	truthy	keydown
					;							redraw	()																									}
//				,											 null			//before	any	truthy	keyup
//				,											 null			// after	any	truthy	keyup/* */
				,]
			,	["P","S","Z"								,(ev,char)=>{if(!ev.shiftKey)char=char.toLowerCase();$(`[accesskey=${char}]`).click()}
				,											 null
				,											 (ev,char)=>{												mousemoveStop(true)					}
				,]
//			,	["shift","?"								,(ev,char)=>{},"id:help","help: help",]
			,]).call(document)
	
	;										const key=$b.keyWhole.key.bind($b.keyWhole,{maps:document,mapSerial:0})
	
	;var																									 toolbar
	=																						app				.toolbar
	=								$(		'#'	+															'toolbar'	)[0]
	
	;var																									 container
	=																						app				.container
	=								$(		'#'	+															'container'	)[0]
	;var																									 canvas
	=																						app				.canvas
	=								$(																		 container	)
	.							 find(																		'canvas'	)[0]
	
	;var				data
	,					data_bounds
	
	;						$b.ensure_jq
		(						document.body,								  '#sizer'					,/* html */`
		${	''							}	<div	style="		grid-area	:	sizer
		${	''							}		;			  --breadth		:	5.0px
		${	''							}		;				width		:	var(--breadth)
		${	''							}		;				height		:	100%
		${	''							}		;				background	:	currentColor
		${	''							}		;				cursor		:	ew-resize
		${	''							}		;				user-select	:	none					"
		${	''							}									 id=sizer						>`)
	;function									  sizer								(	event													){
		;							$(	document.body		).css({'--right-width'	: (	event	== undefined
				?				$b.storage(this,localStorage
					,							 'sizer'																)
				||				$b.css_length
					(				$(	document.body		).css( '--right-width'									)	).number
				:				$b.storage(this,localStorage
					,							 'sizer',		Math.min(Math.max(0,	event.view	.innerWidth
							-															event.		clientX
							-	$b.css_length
								(	$(		'#'	+'sizer'	).css( '--breadth'										)	).number/2)
						,																event.view	.innerWidth						)	))+'px'})}
	;								$(		'#'	+'sizer'	)
	.		 on('mousedown'						,function(								ev){		this.	state=1
			;						$(	document			)
			.on('mouseup'						,										ev=>{		this.	state=0
//				;																			redraw()
				;																									})
			.on('mousemove'						,										ev=>{if(	this.	state
					)							  sizer(								ev						)	})}	)
	;											  sizer(																)/**/
	
	;										var																z
	;										Object.defineProperty(							app,		   'z'
		,	{						get:()=>																z
				=							$b.storage
					(				this, localStorage,													   'z'														)
				||																															  100
			,						set:	function(																									v			)
				{																							z										=	v
				;							$b.idle(arguments,500
				,					this,	function(){
					;						$b.storage
						(			this, localStorage,													   'z',											v)	}	)
				;							$(																								 `#zoom
					`+																							`input`											)
				.								 val(																									v		)
				;							$(																								 `#zoom
					`+																										 `.feedback`).text(			v		)	}	}	)
	;										$b.jqoffon
		(									$b.ensure_jq(													 toolbar,						 '#zoom'					,/* html */`
			${	''																						}	<label							id=zoom						style="							flex-grow:1;margin-left:5px																					;display:flex;align-items:center">
			${	''																						}		${key([		"-"	])}
			${	''																						}		${key([		"+"	])}
			${	''																						}		<input type=range min=1 value=100 max=100000			style="accent-color:darkgray;background:lightgray;flex-grow:1"/><!-- cspell:ignore darkgray lightgray -->
			${	''																						}		<span	class="feedback"								style="margin-right:2px"></span>
			${	''																						}		</label>`									)
		.													children		(									'input'													)
		.										 val						(				app.			z															)
		,										'input',function(ev,initial){
			;								let	 val
			=							$(this). val	()
			;																				app.			z
			=									 val
			;							$(this). parent	().	children(														 '.feedback').text
				(								 val																												)
			;if(												!	initial
				)								redraw	()
			;}).						trigger('input',			true																									)
	
	;										let																											   ctv_scroll
	;										$b.ensure_jq(													 toolbar,									 '#ctr_scroll'	,/* html */`
		${	''																							}	<span										id=ctr_scroll	style="																																		 display:flex;align-items:center">
		${	''																							}		<label													title="zoom"
		${	''																							}																							 >${key([		"Z"	])}<i class='fa-solid fa-magnifying-glass			'></i
		${	''																							}				><input type=radio	name=s	data-k=ctv_scroll	value="z"	accesskey="z"	/></label>
		${	''																							}		<label													title="scroll"
		${	''																							}												id=ctl_scroll				accesskey="s"	 >${key([		"S"	])}<i class='fa-solid fa-arrows-up-down				'></i></label>
		${	''																							}		<label													title="pan"
		${	''																							}				><input type=radio	name=s	data-k=ctv_scroll	value="p"	accesskey="p"	/>${key([		"P"	])}<i class='fa-solid fa-arrows-up-down-left-right	'></i></label></span>`	)
	;										$b.radiostar(																									  'scroll'													) //cspell:ignore radiostar
	;										$b.jq_storage__byAttr_valueBy_byOnChange
		(	'																																	   [data-k=ctv_scroll											]	'
		,								  localStorage,																									null,				  "z"										)
	.on(		'change',function(){
		;if(						this.checked)																										   ctv_scroll
			=																				app	.														   ctv_scroll
			=								$b.storage
				(					this, localStorage,																							's'																)	}	)
	.trigger(	'change'																																																)
	
	;										$b.ensure_jq(													 toolbar,									 '#ctr_center'	,/* html */`
		${	''																							}	<span										id=ctr_center	style="																																		 display:flex;align-items:center">
		${	''																							}		<label													title="center"
		${	''																							}																			accesskey="c"	 >${key([		"C"	])}</label></span>`	)
	
	;										var																 centerTranslateLimits
	
	;										let																 centerTranslate
	=										$b.storage
		(							this, localStorage,														'centerTranslate'								)
	||	[																									0,	0											]
	;										Object.defineProperty(							app,			'centerTranslate'
		,	{						get:()=>																 centerTranslate
			,						set:	function(																				v						)
				{if(																						!centerTranslateLimits
					)																						 centerTranslateLimits
					=	data_bounds
				;																							 centerTranslate
				=												$b.max(										 centerTranslateLimits[0]
					,											$b.min(										 centerTranslateLimits[1]
						,																											v))
				;							$b.idle(arguments,500
				,					this,	function(){
					;						$b.storage
						(			this, localStorage,														'centerTranslate'	,	v			)	}	)	}
			,})
	
	;										let																			wheelTimeout
	;										let																			wheelDelta		 = [0,0]
	;										$b.jqoffon(														 canvas,`	wheel`			,function(		ev){
			
			;																											wheelDelta[0]	+=				ev.originalEvent.deltaX
			;																											wheelDelta[1]	+=				ev.originalEvent.deltaY
			
//			;if(																										wheelTimeout
//				) clearTimeout(																							wheelTimeout)
//			;																											wheelTimeout
//			=		setTimeout(()=>{
//				; clearTimeout(																							wheelTimeout)
//				;																										wheelTimeout= null
				
				;if(																																	   ctv_scroll=='z'
					)																		app	.			z
					=						Math.min(Math.max(																				    1
							,																				z		+	wheelDelta[1]/10),	10000		)
				else																		app	.			 centerTranslate
					=											$b.sub2(									 centerTranslate
						,																					 canvas	.	draw
						.																					 pixel
							(													 'scale',								wheelDelta							 ))
				
				;																										wheelDelta		 = [0,0]
				
				;								redraw()
				
//				;},500)
			;})
	
	;										$b.jqoffon(														document
		,																									'canvas',`	mousedown`		,function(		ev										){
			;																											switch(							ev.type								){case NaN:
				;break;	case																						   'mousedown'		:if(	!		ev.button
					||																													1		==		ev.button // with an apple magic mouse I see 0 for regular/left click and 2 for context/right click
						)																					 canvas	.	mousedownPixels
						=										$b.pos4coordinates(																		ev								)
				;break;																									default
					:	throw																						   'default'															}	}	)
	;										$b.jqoffon(														document,`	click			`,function(		ev										){
			;																				app	.						mousemovePoint_click
			=																				app	.						mousemovePoint_hover
			
			;									redraw()																																		}	)
	;										function																	mousemoveStop(					reset										){
		;if(																				app	.						mousemoveOrigin			&&		reset
			)																				app	.						mousemoveOrigin[0]
				[																			app	.						mousemoveOrigin[1]]
			=																				app	.						mousemoveOrigin[2]
		;																									 canvas	.	mousedownPixels			=		null
		;																					app	.						mousemoveOrigin			=		null										}
	;										function																	mousemoveDrag2
		(																					obj	,						key,							ev											){
		;if(																			!	app	.						mousemoveOrigin
			)																				app	.						mousemoveOrigin
			=	[																			obj,						key
				,																			obj[						key]]
		;									return											obj[						key]
		=														$b.add2(					app	.						mousemoveOrigin[2]
			,																								 canvas	.	draw
//			,													$b.vid2(									 canvas	.	draw.s.factors // has-been fixme rewrite draw.pixel like translate for scale only (and default to reverse order and inverse arithmetic ops)
//				,												$b.bus2(																this.drag
//					,											$b.pos4coordinates(																		ev							)	)	)
			.																								 pixel	(  'scale'
				,												$b.bus2(									 canvas	.	mousedownPixels
					,											$b.pos4coordinates(																		ev							)	)	)	)	}
	;										$b.jqoffon(														document,`	mousemove
																														mouseup			`,function(		ev										){
			;																											switch(							ev.type								){case NaN:
				;break;	case																						   'mousemove'
					:		if(																				 canvas	.	mousedownPixels													){
						;										$b.storage
						  (								this, localStorage,									'centerTranslate'
						  ,																								mousemoveDrag2
							(																app	,			'centerTranslate',							ev						)	)
						;						redraw()																																}
					 else if(																				 canvas	==									ev.target						){
						;																	app	.						mousemovePixels
						=																					 canvas	.	draw
						.																					 pixel
							(									$b.pos4coordinates(			app	.						mousemoveEvent			=		ev						)	)
						;						redraw()																																}
				;break;	case																						   'mouseup'
					:																									mousemoveStop()
				;break;																									default
					:	throw																						   'default'															}	}	)
	
	;																						app	.				jsonNumberViaString
	=	{																										maximumSignificantDigits	:3
		,																										maximumFractionDigits		:3
		,																										minimumFractionDigits		:3
		,																										notation					:"engineering"
		,}
	
	;									let																				layers
	=																						app	.						layers
	=	{unitCross
		:[(D,l)=>{
			
			;							D	.	cross	(					  [0,0]				,		   10,0	,D.	pxSeg										) // unit
			.									stroke // \b(stroke|fill)
				(						l[1].	color																											)
			
			;																																						}
		  ,	{									color														:				'#0000ff' // '(gray|yellow|red|purple|blue|cyan|green|#[0-9A-Fa-f]{8}|#[0-9A-Fa-f]{6}|#[0-9A-Fa-f]{4}|#[0-9A-Fa-f]{3})'
			,																																						}	] // NOTE: the layers object could be a constant list closing over vars, namely P, outside of redraw()
		,unitCrossLabels
		:[(D,l)=>						D	.	cross	(					  [0,0]				,		   10
			,															  0
			,function		(		s){	let						r	 =	- 2+arguments.length
				;if(											r	<=	  2
				  )						D	.	text
					(					$b	.	move
						(			s[1]							,	-		D				.pixel
							(												 'scale'
							,												 'min',						    5	)
						,				$b	.	atan2
							(		s[1]																											)	)
					, ['x','y'][+(								r	<	  2																			)	]
					,null,				l[1].	color																					,'transparent',0,D.OUT,'9px Monaco, Inconsolata, Consolas, Lucida Console, Courier New, Courier, monospace' //cspell:ignore Inconsolata, Consolas, Lucida
					,											r	<	  2 ? 'center'	: 'right'
					,											r	<	  2 ? 'top'		: 'middle'															)	}	)
		  ,	{									color														:				'#80ffff'								}	]
		,centerTranslate
		: [(D,l)=>{
			
			;if(																			app	.						mousemovePixels							){
				
				;						D	.	text
					(					D	.	edge	([					0,	D				.pixel
										(								   'abscale'
										,									 'scale'
										,									 'min',						   10	)]	)
					,					JSON. stringify	(													 centerTranslate
						,																							 $b.jsonNumberViaString
							(null,null,														app	.						jsonNumberViaString			)	)
					,null,				l[1].	color																					,'transparent',0,D.OUT,'9px Monaco, Inconsolata, Consolas, Lucida Console, Courier New, Courier, monospace' //cspell:ignore Inconsolata, Consolas, Lucida
					,															   'right','top'															)
				
				;}
			
			;																																						}
		  ,	{									color														:				'white'									}	]
		,mousemoveCross
		: [(D,l)=>{
			
			;if(																			app	.						mousemovePixels							){
				
				;						D	.	cross	(									app	.						mousemovePixels
					,																					   10,0	,D.	pxSeg									)
				.								stroke
					(					l[1].	color																										)
				
				;						D	.	text
					(					D	.	edge	([					1,	D				.pixel
										(								   'abscale'
										,									 'scale'
										,									 'min',						    5	)]	)
					,					JSON. stringify	(									app	.						mousemovePixels
						,																							 $b.jsonNumberViaString
							(null,null,														app	.						jsonNumberViaString			)	)
					,null,				l[1].	color																					,'transparent',0,D.OUT,'9px Monaco, Inconsolata, Consolas, Lucida Console, Courier New, Courier, monospace' //cspell:ignore Inconsolata, Consolas, Lucida
					,																'left','top'															)
				
				;}
			
			;																																						}
		  ,	{									color														:				'gray'									}	]
		/*
app.extra=(D,z)=>	[					D.edge (		[0,	 .5/40])
					,].map(v=>(D,z)=>{	D.cross(			v,z/40,0,D.pxSeg).stroke('yellow',1)
						;				D.text ($b.move	(	v,z/40,.25),JSON.stringify(v,$b.jsonNumberViaString(null,null,app.jsonNumberViaString)),null,'#00ffff','transparent',0,D.OUT,'9px Monaco, Inconsolata, Consolas, Lucida Console, Courier New, Courier, monospace','left','top')}); app.redraw() //cspell:ignore Inconsolata, Consolas, Lucida
		*/
		,extra
		:D=>{							let					P					=		!	app	.						extra?[]
			:																				app	.						extra
				(						D,																z														)
			
			;						for(let							p
				in											P																									){
				
				;						D .ctx.	beginPath()
				
				;											P	[	p																						]
					(					D,																z													)
				
				;																																				}
			
			;																																						}
		/* */
		
		/* following the next ine of code are some development originals, each over-writable in a console by passing the keyed:function in an object (L) to the next line of code:
			((L) => (D => D.layers(L).reset().draw())($('canvas')[0].draw))
			*/
//		,testSeg	:D =>						D		.seg	([		[-1/4			,+1/4	],		[+1/4			,-1/4	]]	).stroke('yellow'	)
//		,testRectXf	:D => D.stroke('green') &&	D.ctx	.rect	(D._xf	(-1/4,0	),D._xf	(+1/4,1	),D._s	(+2/4,0	),D._s	(-2/4,1	)	)
//		,testRect	:D =>						D		.rect	(		[-1/4			,+1/4	],		[+2/4			,-2/4	]	).stroke('gray'		)
//		,test		:D =>						D		.circle	([0,0],	D						.pixel(D.transform(0,'min'),'x')	).stroke('gray'		) // untested after changed api in pixel()
		
		,} //									layers
	
	;																						app
	.											redraw
	=											redraw	=	()=>{
		//canvas.draw.clearCanvas=function(){this.ctx.clearRect(0,0,this.ctx.canvas.width,this.ctx.canvas.height);return this};(()=>{let w=canvas.draw.ctx.canvas.width,h=canvas.draw.ctx.canvas.height;return((...i)=>canvas.draw.inner(...i).clearCanvas().draw())('min',[Math.min(w,h),-Math.min(w,h)])})()
		;																									 canvas	.	draw
		=														$b.														draw
			(																				app	.			 canvas															)
		.																outer	(			app	.			 container														)
		.																inner	('min'
			,	[														Math.min(			app	.			 canvas	.	width
					,																		app	.			 canvas	.	height										)
				/	(																					z/100														)
				,														Math.min(			app	.			 canvas	.	width
					,																		app	.			 canvas	.	height										)
				/	(																					z/100														)	]	)
		.																center	('round',	app	.			 centerTranslate												)
		
		;																									 canvas	.	draw
		.layers(																										layers)
//		.																											reset	() // for some unknown reason the function here called f is called twice in the equivalence of $.when(…).then(f) above (next ending block)
		.																											draw	()
		;} //									redraw
	
	;										$b.jqoffon(														 canvas.ownerDocument.defaultView // cspell:ignore jqoffon
		,									   'resize'
		,										redraw )
//	;										let resizeObserver
//	=										new ResizeObserver
//		(										redraw)
//	.												  observe(												 canvas)
	
	;const										 local = $b.methodize([null
		,	function postMessage(type, data	){	vscode.	postMessage(data?Object.assign({type},data):{type})} // setting window.postMessage seem to have bad side effects
		,])
	;		function getDocument(			){	 local.	postMessage('getDocument')}
	
	;function		get_data_bounds()
		{return			data_bounds=$b.rects2rect($b.xGet(data,'/document/scenes/scene').map(v=>[(p=>$b.pos4coordinates([p&&p.getAttribute('x'),p&&p.getAttribute('y')]))($b.xGet(v,'./point[@key="canvasLocation"]')),(p=>$b.pos4coordinates([p&&p.getAttribute('width')||0,p&&p.getAttribute('height')||0]))($b.xGet(v,'./objects/*/*/rect[@key="contentRect" or @key="frame"]'))]))}
	
	// @ts-check
	// @ts-ignore
	;const										vscode = acquireVsCodeApi()
	
	;function renderDocument(/** @type {string} */ text) {
		;				data=new DOMParser().parseFromString(text, "application/xml")
		;			get_data_bounds()
		;										redraw()
		;}
	
	;window.addEventListener('message', event => {
		;const message = event.data
		;switch(message.type){case NaN:
			;break;case 'setDocument':
				;const text = message.text
				;renderDocument(text)
				// Then persist state information.
				// This state is returned in the call to `vscode.getState` below when a webview is reloaded.
				;vscode.setState({text})
			;}
		;})
	
	// Webviews are normally torn down when not visible and re-created when they become visible again.
	// State lets us save information across these re-loads
	;const state = vscode.getState()
	;if(state) renderDocument(state.text)
	;else local.postMessage('getDocument')
	
	;toolbar_getDocument.onclick=getDocument