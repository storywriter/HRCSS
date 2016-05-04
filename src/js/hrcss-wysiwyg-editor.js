/**
 * WYSIWYG HTML Editor for Human Readable CSS
 * last Update: 2016/5/1 @storywriter
 *
 * Require libraries:
 * jquery v1.10.2
 * jquery-ui v1.10.3 ( core, widget, mouse, sortable )
 *
 *
 * コーディングスタイル（コーディング規約）：
 * 「JavaScript Style Guide | Contribute to jQuery 」にしたがう。
 * JavaScript Style Guide | Contribute to jQuery : https://contribute.jquery.org/style-guide/js/
 *
 */


/*
ToDo:

image Upload function

editable:
bricks-editable
bricks-editable-text
bricks-editable-image
bricks-editable-table
bricks-editable-table-tr
bricks-editable-table-td
bricks-editable-list
bricks-editable-dl
bricks-editable-input
bricks-editable-html : well-formedかどうかチェックする
bricks-editable-cms

要素を見て、自動判別させるか、自分で指定させるか。両方？


命名規則 _getMain _getBrickkiln ゲッターなのか。

jQueryをラップして、他のjQueryバージョンと競合しないようにする。
	<script>document.write('<script src="js/vendor/jquery-1.10.2.js"><\/script><script src="js/vendor/jquery-ui.js"><\/script>')</script>

baseURLの実装

サンプルデータの作成

ドキュメントの作成:
	前提・制約条件:
		#bricks-mainの設置、1箇所
		#bricks-main内では<ins>のunderlineはnoneになる
		user/bricks.htmlの記述
		body margin-top の上書き
		接頭詞 bricks- は予約語
		editableな要素は限られる divはeditableではないので注意(テキストはpで)
		editableな要素で、初期テキストは「>>」から始めると、入力時に消える。指示を書くときに便利。(メール返信とかあるが、これでいいのか？)


copy cut paste エフェクト、いれる？　いらない気もする。
　cut　fadeOut
　paste　fadeIn

アクセシビリティ対応版つくる

キーボード操作に対応する

a target="_blank"に対応する


バグ報告
jQuery ui -> sortable:
・forceHelperSize: true にしても、connectWithした先にドラッグすると、HelperSizeが維持されない?
・ui.offsetとui.positionの値が同じ
・out イベントがfireしない（receiveのタイミングでfireしてる？）

*/

/*
ToDo:

・href属性の保管と削除
・style属性の保管と削除
・class:ui-sortable　ui-sortable-disabledの削除 _destroyでできる。

*/

;( function( d, $ ) { 



var hrcssWysiwygEditor = document.hrcssWysiwygEditor = {

	pointer: {},

	status: function(){
		return ( ( $( '.hrcss-editInPlace-dialog' ).length > 0 ) ? true : false ); /* true : 編集起動中 , false : 編集未起動 */
	},

	dblclick: false, /* for accessibility : 'dblclick' event is not accessible. */

	clipboard: {},

	undo: {},

	systemTemplates: {},

	components: {},

	dialog: function( message, func ){

		var _this = this;

		var dialog, overlay;

		dialog = $( _this.systemTemplates.find( '.hrcss-dialog' ).clone() );
		overlay = $( _this.systemTemplates.find( '.hrcss-overlay' ).clone() );

		overlay.appendTo( 'body' );
		overlay.append( dialog );

		dialog.find( '.hrcss-dialog-message' ).html( message );

		dialog.css( {
			top: ( $( window ).height() - dialog.height() ) / 2,
			left: ( $( window ).width() - dialog.width() ) / 2
		} );

		overlay
			.on( 'click', function( event ){

				var action = $( event.target ).hasClass( 'hrcss-dialog-ok' );
				if( action ){
					func();
				}

				overlay.remove();

			} );

	},

	alert: function( message, func ){

		var _this = this;

		var dialog, overlay;

		dialog = $( _this.systemTemplates.find( '.hrcss-alert' ).clone() );
		overlay = $( _this.systemTemplates.find( '.hrcss-overlay' ).clone() );

		overlay.appendTo( 'body' );
		overlay.append( dialog );

		dialog.find( '.hrcss-alert-message' ).html( message );

		dialog.css( {
			top: ( $( window ).height() - dialog.height() ) / 2,
			left: ( $( window ).width() - dialog.width() ) / 2
		} );

		overlay
			.on( 'click', function( event ){

				var action = $( event.target ).hasClass( 'hrcss-alert-ok' );
				if( action ){
					func();
				}

				overlay.remove();

			} );

	},

	init: function(){
		
		var _this = this;

		var sortableOption = {
			opacity: 0.5,
			cursor: 'move',
			zIndex: 10060
		}

		var index = 0;

		var picker;


		/* ComponentsPicker */

		picker = $( _this.systemTemplates.find( '.hrcss-picker' ).clone() );

		/* 表示 */
		$( 'body' ).prepend( picker );

		/* タブの生成 */
		_this.components.find( '.-tab' ).each( function( index ){

			var tab = $( this );
			var tabPane = _this.systemTemplates.find( '.hrcss-tab-pane' ).clone();
			var tabContent = _this.systemTemplates.find( '.hrcss-tab-content' ).clone();

			tabPane.text( tab.find( '.-tab-title' ).text() );
			picker.find( '.hrcss-picker-tab-panes' ).append( tabPane );
			picker.find( '.hrcss-picker-tab-content' ).append( tabContent );

			if( index === 0 ) {
				tabContent.show();
			}


			tabPane
				.on( 'click', function( event ){
					picker.find( '.hrcss-tab-content' ).hide();
					picker.find( '.hrcss-tab-pane' ).removeClass( 'active' );
					tabContent.show();
					tabPane.addClass( 'active' );
				} );


			/* タブ内のコンポーネントリストの生成 */
			tab.find( '.-component' ).each( function(){

				var component = $( this );

				/* コンポーネントのリストを配置する */
				var componentSelector = _this.systemTemplates.find( '.hrcss-tab-component' ).clone();
				componentSelector.find( 'span' ).text( component.find( '.-component-title' ).text() );
				componentSelector.prepend( component.find( '.-component-image' ) );
				$( tabContent ).append( componentSelector );

				/* コンポーネントのメタを外す */
				component.find( '.-component-title' ).remove();
				component.find( '.-component-image' ).remove();
				component.find( '.-component-description' ).remove();

				component = component.children();

				/* コンポーネントの種類を確認する */
				var block = component.eq( 0 ).hasClass( '-block' ),
						element = component.eq( 0 ).hasClass( '-element' );

        /* テーブルは、tbody、tr、td だけだと DOM を構成しないため、個別に対応する。
            ・tr や td　だけ単体であると、DOMから消える。
            ・td だけ書いても、ブラウザで table > tbody > tr > td まで補完される。
        */
        var ignore = component.eq( 0 ).hasClass( '-ignore' );
        if( ignore ) {

          /* tableの要素を探す（条件文は、親から順に分岐する） */
          if( component.find( '.-tbody' ).length ) {
            component = component.find( '.-tbody' );
          } else if( component.find( '.-tr' ).length ) {
            component = component.find( '.-tr' );
          } else if( component.find( '.-td' ).length ) {
            component = component.find( '.-td' );
          } else {
            /* 1階層スキップする */
            component = component.find( ':first' );
          }

        }

				/* コンポーネントの class属性を保持する */
				var classes = component.eq( 0 ).attr( 'class' );

        /* テーブル（ -table, -tgroup, -tr, -td ）は、ほかの要素と一線を画しているため、個別に対応する */
        var table = ( classes.indexOf( '-table' ) > -1 ) ? true : false,
            tbody = ( classes.indexOf( '-tbody' ) > -1 ) ? true : false, /* tbody, thead, tfoot */
            tr = ( classes.indexOf( '-tr' ) > -1 ) ? true : false,
            td = ( classes.indexOf( '-td' ) > -1 ) ? true : false; /* td, th */

        /* リスト（ -list, -listitem ）は、個別に対応する */
        var list = ( classes.indexOf( '-list' ) > -1 ) ? true : false, /* ul, ol */
            listitem = ( classes.indexOf( '-listitem' ) > -1 ) ? true : false; /* li */



				/* コンポーネントを移動して、追加できるようにする */
				componentSelector
					.on( 'mousedown', function( event ){

						var items;
						if( block ) {
							items = '> .-block';
						} else if( element ) {
							items = '.-block, .-element';
						} else if( tbody ) {
              items = '.-tbody';
            } else if( tr ) {
              items = '.-tr';
            } else if( td ) {
              items = '.-td';
            } else if( listitem ) {
              items = '.-listitem';
            }

						sortableOption = $.extend( {}, sortableOption, {
							items: componentSelector,
							connectWith: $( '.-wysiwyg' ),
							forceHelperSize: true,
							forcePlaceholderSize: true,
							placeholder: 'hrcss-sortable-placeholder',
							start: function( event, ui ){
								$( '.hrcss-sortable-placeholder' ).width( ui.item.outerWidth( true ) );
							},
							stop: function( event, ui ){
								$( '.hrcss-picker-tab-content' ).sortable( "destroy" );
							}
						} );

						/* Picker の sortable を有効にする */
						$( '.hrcss-picker-tab-content' ).sortable( sortableOption );


						sortableOption = $.extend( {}, sortableOption, {
							items: items,
							forceHelperSize: true,
							forcePlaceholderSize: true,
							stop: function( event, ui ){
								$( '.-wysiwyg' ).sortable( "destroy" );
							},
							receive: function( event, ui ){ /* コンポーネントがドロップされたとき */

								var include;
								var includes;

                var uiParentClass;

                /* tableの要素を探す（条件文は、親から順に分岐すること） */
                if( tbody ) {
                  uiParentClass = ui.item.closest( '.-table' ).attr( 'class' );
                } else if( tr ) {

                  if( ui.item.closest( '.-tbody' ).length ) {
                    uiParentClass = ui.item.closest( '.-tbody' ).attr( 'class' );
                  } else {
                    uiParentClass = ui.item.closest( '.-table' ).attr( 'class' );
                  }

                } else if( td ) {
                  uiParentClass = ui.item.closest( '.-tr' ).attr( 'class' );
                } else {
                  /* table以外 */
                  uiParentClass = ui.item.parent().attr( 'class' );
                }

                include = ( uiParentClass.indexOf( '-include' ) > -1 ) ? true : false;

								var parent = ( classes.indexOf( '-parent' ) > -1 ) ? true : false;
								var parents;

                var permission = true; /* ここに追加していいか */
//              if( include || parent || table || tbody || tr || td ) {
                if( include || parent ) {
                  permission = false; /* 親要素に -include: があるか、子要素に -parent: があるときは、追加に制約がある */
                }

								/* -include:の対象リストをつくる */
								if( include ) {
									includes = uiParentClass.split( ' ' );
									if( includes.length > 1 ) {

										includes = $.grep( includes, function( elem, index ){
											return ( elem.indexOf( '-include' ) > -1 ) ? true : false;
										} );
										includes = $.map( includes, function( elem, index ){
											return elem.replace( '-include:', '' );
										} );
									}

									/* テーブル（ -table, -tbody, -tr, -td ）は、個別に対応する */
									/* if( table ) { 
										includes.push( '-tbody', '-tr' );
									}
									if( tbody ) { 
										includes.push( '-tr' );
									}
									if( tr ) { 
										includes.push( '-td' );
									} */

									$( includes ).each( function(){
										if( classes.indexOf( this ) > -1 ) {
											permission = true; /* ここに追加していい */
										}
									});

								}

								/* -parent:の対象リストをつくる */
								if( parent ) {
									parents = classes.split( ' ' );
									if( parents.length > 1 ) {

										parents = $.grep( parents, function( elem, index ){
											return ( elem.indexOf( '-parent' ) > -1 ) ? true : false;
										} );
										parents = $.map( parents, function( elem, index ){
											return elem.replace( '-parent:', '' );
										} );
									}

                  /* テーブル（ -table, -tbody, -tr, -td ）は、個別に対応する */
                  /* if( tbody ) { 
                    parents.push( '-table' );
                  }
                  if( tr ) { 
                    parents.push( '-table', '-tbody' );
                  }
                  if( td ) { 
                    parents.push( '-tr' );
                  } */

									$( parents ).each( function(){
										if( uiParentClass.indexOf( this ) > -1 ) {
											permission = true; /* ここに追加していい */
										}
									});

								}

								if( permission ) { /* 制約はなく、追加できるなら */

                  /* コンポーネントを追加する */

                if( td ) { /* セルの追加なら、ほかの行にも追加する */

                  /* 自分は何番目のセルか調べる */
                  var _index = ui.item.index();
                  ui.item.closest( '.-table' ).find( '.-tr' ).each( function(){

                    var _td = $( this ).children();
                    var _tagName, _tmp;

                    /* 追加位置の左右のセルを見て、th要素 なら th要素 で追加する。（注意：DOM要素そのものを変更している）*/
                    if( _index === 0 ) {
                      _tagName = _td.eq( _index + 1 ).get( 0 ).tagName;
                    } else {
                      _tagName = _td.eq( _index - 1 ).get( 0 ).tagName;
                    }

                    /* 追加予定の HTML を一時保管 */
                    _tmp = component.clone();

                    if( _tagName.toUpperCase() === 'TH' ) { /* TODO: l18nでは.toUpperCase()は使えない地域（トルコとか）がある */

                        var _th = $( '<th>' );

                        $.each( _tmp.get( 0 ).attributes, function(){
                          _th.attr( this.name, this.value ); /* unwrap()する前に属性をコピーする TODO: コピーされない属性があることがある？ */
                        } );

                        _tmp.unwrap();
                        _tmp.appendTo( _th );
                        _tmp = _th;

                    }

                    /* コンポーネントの HTML を追加 */
                    _td.eq( _index ).before( _tmp );

                  } );

                } else if( tr ) {

                  /* 追加先のセルの数を数える */
                  var _tds = ui.item.closest( '.-table' ).find( '.-tr:first' ).children().length;

                  /* 自分自身のセルの数を数える */
                  var _self = component.children().length;

                  /* 追加予定の HTML を一時保管 */
                  var _tmp = component.clone();
                  var _abs = Math.abs( _tds - _self );

                  if( _tds - _self > 0 ) { /* tdが足りていなければ */

                    for( var i = 0; i < _abs; i++ ) {
                      _tmp.append( _tmp.find( '.-td:last' ).clone() ); /* tdを追加 */
                    }

                  } else if( _tds - _self < 0 ) { /* tdが多すぎたら */

                    for( var i = 0; i < _abs; i++ ) {
                      _tmp.find( '.-td:last' ).remove(); /* tdを削除 */
                    }

                  }

                  /* コンポーネントの HTML を追加 */
                  ui.item.after( _tmp );

                } else {

                  /* コンポーネントの HTML を追加 */
                  ui.item.after( component.clone() );

                }



								} else {
									_this.alert( 'そのコンポーネントは、ここに追加できません。', function(){} );
								}

								$( '.-wysiwyg' ).sortable( "destroy" );
								$( '.hrcss-picker-tab-content' ).sortable( 'cancel' );

							}
						} );

						/* 本文 の sortable を有効にする */
						$( '.-wysiwyg' ).sortable( sortableOption );


					} );


			} );

		} );


		/* 保存ボタンがクリックされたとき */

		picker.find( '.hrcss-picker-control-save' )
			.on( 'click', function( event ){

				/* 不要なセレクタの削除 */
				$( '.hrcss-hover-bold' ).removeClass( '.hrcss-hover-bold' );
				$( '.hrcss-hover' ).removeClass( '.hrcss-hover' );

				/* 編集中なら終了する */
				if( _this.status() ) {
					$( '.hrcss-editInPlace-dialog' ).find( '.hrcss-editInPlace-ok' ).trigger( 'click' );
				}

				/* sortable を破棄する */
				if( $( '.-wysiwyg' ).hasClass( 'ui-sortable' ) ) {
					$( '.-wysiwyg' ).sortable( "destroy" );
				}

				/* HTML を表示する */
				$( '.-wysiwyg' ).each( function(){

					var _text = $( this ).html();
					_text = $( '<textarea rows="20" cols="100">' ).html( _text );
					_this.alert( _text, function(){} );

				} );

			} );


		/* ページ上部に Picker ぶんの余白をとる */
		$( 'body' ).css( { 'padding-top' : picker.outerHeight( true ) } );


		/* イベントの設定 */

		$( document )

			/* リンクの動作を停止（mousedownとは別にclickイベントを止める必要がある） */

      .on( 'click', '.-block, .-element, .-editable, [class*=-attribute]', function( event ){
        event.preventDefault();
      } )

			/* 見た目のフォーカスを整え、ポインタを記録する */

			.on( 'mouseenter', '.-block', function( event ){
				$( this ).addClass( 'hrcss-hover-bold' );
			} )
			.on( 'mouseleave', '.-block', function( event ){
				$( this ).removeClass( 'hrcss-hover-bold' );
			} )
			.on( 'mouseenter', '.-element, .-editable, [class*=-attribute]', function( event ){
				$( this ).addClass( 'hrcss-hover' );
			} )
			.on( 'mouseleave', '.-element, .-editable, [class*=-attribute]', function( event ){
				$( this ).removeClass( 'hrcss-hover' );
			} )

			.on( 'mousedown', '.-block, .-element, .-editable, [class*=-attribute]', function( event ){

				event.stopPropagation();

				var action = $( event.target ).hasClass( 'hrcss-editInPlace-ok' ) || $( event.target ).hasClass( 'hrcss-editInPlace-cansel' );

				$( '.hrcss-hover' ).removeClass( 'hrcss-hover' ); /* hoverは解除 */


				if( action ) { /* 編集ダイアログの OKボタン または Cancelボタン */

					_this.pointer = {}; /* ポインタを空にする */
					_this.dblclick = false; /* ダブルクリックを初期化 */
					$( '.hrcss-focus' ).removeClass( 'hrcss-focus' ); /* focusは解除 */

				} else {

					if( event.target === this ) {

						if( !_this.status() ) { /* 他を編集中でなければ */

							if( _this.pointer === this ) {
								_this.dblclick = true; /* ダブルクリックを有効化 */
							} else {
								$( '.hrcss-focus' ).removeClass( 'hrcss-focus' ); /* focusは解除 */
			      	  _this.pointer = this; /* 新しいポインタを記録する */
								$( _this.pointer ).addClass( 'hrcss-focus' ); /* 今回クリックしたもの */
							}

						}

					}

				}

      } )


			/* 移動できるもののときは、移動可能先を洗い出し、sortableにする */

			.on( 'mousedown', '.-block, .-element', function( event ){

				var target = event.target;
				var $target = $( target );

				var block = $target.hasClass( '-block' ),
						element = $target.hasClass( '-element' );

				var sortableOption2 = {

					stop: function( event, ui ){ /* 削除 */

						var _wysiwyg = $( event.target );

						var _uiBottom = ui.offset.top + ui.item.outerHeight();
						var _uiRight = ui.offset.left + ui.item.outerWidth();
						var _mainBottom = _wysiwyg.offset().top + _wysiwyg.outerHeight();
						var _mainRight = _wysiwyg.offset().left + _wysiwyg.outerWidth();

						if( ( _wysiwyg.offset().top - 100 > _uiBottom ) || ( ui.offset.left > _mainRight + 100 ) || ( ui.offset.top > _mainBottom + 100 ) || ( _wysiwyg.offset().left - 100 > _uiRight ) ){ /* '100px' : little wider is better. */

							_this.dialog( '削除してもよろしいですか？', function(){
								ui.item.remove();
							} );

						}

					}
				}

				if( block ) {

					sortableOption = $.extend( {}, sortableOption, sortableOption2, {
						items: "> .-block",
						connectWith: $( '.-wysiwyg' )
					} );
					/* 本文 の sortable を有効にする */
					$( '.-wysiwyg' ).sortable( sortableOption );

				} else if( element ) {

					sortableOption = $.extend( {}, sortableOption, sortableOption2, {
						items: ".-element, .-block"
					} );
					/* 本文 の sortable を有効にする */
					$( '.-wysiwyg' ).sortable( sortableOption );

				}

			} )


			/* EditInPlace で編集する */

			.on( 'click', '.-editable, [class*=-attribute]', function( event ){

				if( _this.dblclick ) { /* for accessibility : 'dblclick' event is not accessible. */

					if( !_this.status() ) { /* 同時に編集できるのは1つのみ */

						var target = event.target;
						var $target = $( target );

						var originalText = '',
								ins, tagName, text, textarea, table, tr;

						var editable = $target.hasClass( '-editable' ),
								attribute = ( $target.attr( 'class' ).indexOf( '-attribute' ) > -1 ) ? true : false;
						var attributes;

						/* -attribute:の対象リストをつくる */
						if( attribute ) {
							attributes = $target.attr( 'class' ).split( ' ' );
							if( attributes.length > 1 ) {

								attributes = $.grep( attributes, function( elem, index ){
									return ( elem.indexOf( '-attribute' ) > -1 ) ? true : false;
								} );
								attributes = $.map( attributes, function( elem, index ){
									return elem.replace( '-attribute:', '' );
								} );
							}
						}

						/* EditInPlace : Dialog */

						ins = _this.systemTemplates.find( '.hrcss-editInPlace-dialog' ).clone();

						/* EditInPlace : OK & Cansel Button */

						ins.append( _this.systemTemplates.find( '.hrcss-editInPlace-control' ).clone() );


						/* EditInPlace : TextArea */

						if( editable ) {

							tagName = $target.context.tagName;

							if( tagName !== 'IMG' && tagName !== 'HR' ){ /* img でも hr でもなければ */

								text = $target.html();
								originalText = text; /* 元のテキストを保存（キャンセル用） */
								text = $.trim( text );
								text = text.replace( /<br.*?>/g, "\n" ); /* @TODO <br class="hidden-xs">などで困る */

								textarea = _this.systemTemplates.find( '.hrcss-editInPlace-textarea' ).clone();
								textarea.width( $target.width() ).height( $target.height() );
								textarea.val( text );

								/* 表示 */
								$target.text( '' );
								$target.append( textarea );
								textarea.focus();

							}

						}


						/* EditInPlace : Attributes */

						if( attribute ) {

							table = _this.systemTemplates.find( '.hrcss-editInPlace-attrTable' ).clone();
							tr = table.find( 'tr' ).clone();
							table.remove( 'table' ).empty();

							for( var _key in attributes ){

								var _tr = $( $( tr ).clone() );
								_tr.find( 'label' ).text( attributes[ _key ] );

								var _val = $target.attr( attributes[ _key ] );
								/* @TODO class属性のとき、hrcssまでさわれてしまう */

								_val = _val.replace( 'hrcss-focus', '' ); /* フォーカスの CSS を外す */
								_val = $.trim( _val );

								_tr.find( 'input' ).attr( 'name', attributes[ _key ] ).val( _val || '' );
								table.append( _tr );

							}

							ins.prepend( table );

						}


						/* 表示 */
						$target.after( ins );


						/* OKボタンがクリックされたとき または その他の要素がクリックされたとき */

						$( '.hrcss-editInPlace-ok', ins )
							.on( 'click', function( event ){

								var _text;

								/* EditInPlace : TextArea */

								if( editable ){

									_text = textarea.val();
									_text = $.trim( _text );
									_text = _text.replace( /\r\n/g, "<br>" ).replace( /(\r|\n)/g, "<br>" );
									$target.html( _text );

								}

								/* EditInPlace : Attributes */

								if( attribute ){

									table.find( 'tr' ).each( function(){

										var $this = $( this ).find( 'input' );
										$target.attr( $this.attr( 'name' ), ( $this.val() || $this.text() ) );

									} );

								}

								ins.remove();


							} )


						/* キャンセルボタンがクリックされたとき */

						$( '.hrcss-editInPlace-cansel', ins )
							.on( 'click', function( event ){

								/* EditInPlace : TextArea */

								if( editable ){

									$target.html( originalText );

								}

								/* EditInPlace : Attributes */

								if( attribute ){}

								ins.remove();

							} )


						} /* / if( !_this.status() ) */

					} /* / if( _this.dblclick ) */


			} )


			.on( 'keydown', function( event ){

				var _ctrlKey;

				var block = $( _this.pointer ).hasClass( '-block' ),
						element = $( _this.pointer ).hasClass( '-element' );

				if( !_this.status() ){ /* 'input' 'textarea' 入力中と競合しないように */

					_ctrlKey = ( event.ctrlKey === true || event.metaKey === true ) ? true : false;

					if( block || element ) {


						if( _ctrlKey && event.keyCode === 67 ) { /* CTRL+C */

							_this.clipboard = $( _this.pointer ).clone();

						} else if( _ctrlKey && event.keyCode === 88 ){ /* CTRL+X */

							_this.clipboard = $( _this.pointer ).clone();
							_this.pointer.remove();

						} else if( _ctrlKey && event.keyCode === 86 ) { /* CTRL+V */

							var _paste = $( _this.clipboard ).clone();
							$( _this.pointer ).after( _paste );
							$(_this.pointer ).removeClass( 'hrcss-focus' );
							_this.pointer = _paste; /* ペーストしたものにフォーカスを移す */

						} else if( event.keyCode === 46 || event.keyCode === 8 ) { /* Del || BackSpace */

							if( $( _this.pointer ).hasClass( '-block' ) || $( _this.pointer ).hasClass( '-element' ) ) {

								_this.dialog( '削除してもよろしいですか？', function(){
									_this.pointer.remove();
								} );

							}
							if( event.keyCode === 8 ){ return false; } /* Disable 'Page Back' on the 'BackSpace' key */

						} else if( _ctrlKey && event.keyCode === 90 ) { /* CTRL+Z */
							/* ToDo: UnDo Function */

						} else if( _ctrlKey && event.keyCode === 89 ) { /* CTRL+Y */
							/* ToDo: ReDo Function */

						}


					}

				}

			});


	}

}


$( window ).load( function(){

  /* ページロード時の初期設定 */

  $.when(

  	$.get( 'system-templates/hrcss-wysiwyg-editor.html' ),
    $.get( 'user-components/sample.html' )

  ).done( function( templates, components ){

		hrcssWysiwygEditor.systemTemplates = $( templates[2].responseText );
		hrcssWysiwygEditor.components = $( components[2].responseText );
	  hrcssWysiwygEditor.init();

	} ).fail( function(){

  	alert( 'Error: 設定ファイルが読み込めません。' );

	} );

} );


} )( document, jQuery );


var _c = _C = function( obj ){ console.log( obj ) }; /* デバッグ用 */


