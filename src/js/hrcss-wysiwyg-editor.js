/**
 * WYSIWYG HTML Editor for Human Readable CSS
 *
 * Require libraries:
 * jquery v1.10.2
 * jquery-ui v1.10.3 ( core, widget, mouse, sortable )
 *
 * Authors ordered by first contribution:
 *   - Yoshiki HAYAMA @storywriter
 *
 * コーディングスタイル（コーディング規約）：
 * 「JavaScript Style Guide | Contribute to jQuery 」にしたがう。
 * JavaScript Style Guide | Contribute to jQuery : https://contribute.jquery.org/style-guide/js/
 *
 */


;( function( d, $ ) { 



var hrcssWysiwygEditor = document.hrcssWysiwygEditor = {

	pointer: {},

	status: function(){ /* editInPlace が動作中か調べる */
		return ( ( $( '.hrcss-editInPlace-dialog' ).length > 0 ) ? true : false ); /* true : editInPlace あり, false : editInPlace なし */
	},

  hovering: false, /* 要素の移動中に hover や editInPlace を効かせない */

	dblclick: false, /* for accessibility : 'dblclick' event is not accessible. */

	clipboard: {},

	undo: {},

	systemTemplates: {},

	components: {},

  permission: function( target, component ){ /* その target の親要素に、その component を追加してよいか調べる */

// _this.permission( ui.item, component )

    var child; /* class="-child:xxx" があるか */
    var children; /* class="-child:xxx" の配列 */
    var parent; /* class="-parent:xxx" があるか */
    var parents; /* class="-parent:xxx" の配列 */

    var permission = true; /* ここに追加していいか */

    /* コンポーネントの class属性 */
    var componentClass = component.eq( 0 ).attr( 'class' );

    /* target の親要素の class属性 */
    var targetParentClass;

    var tbody = ( componentClass.indexOf( '-tbody' ) > -1 ) ? true : false,
        tr = ( componentClass.indexOf( '-tr' ) > -1 ) ? true : false,
        td = ( componentClass.indexOf( '-td' ) > -1 ) ? true : false;

    /* tableの要素を探す（条件文は、親から順に分岐すること） */
    if( tbody ) {

      targetParentClass = target.closest( '.-table' ).attr( 'class' );

    } else if( tr ) {

      if( target.closest( '.-tbody' ).length ) {
        targetParentClass = target.closest( '.-tbody' ).attr( 'class' );
      } else {
        targetParentClass = target.closest( '.-table' ).attr( 'class' );
      }

    } else if( td ) {

      targetParentClass = target.closest( '.-tr' ).attr( 'class' );

    } else { /* table以外 */

      targetParentClass = target.parent().attr( 'class' );

    }

    child = ( targetParentClass.indexOf( '-child' ) > -1 ) ? true : false;
    parent = ( componentClass.indexOf( '-parent' ) > -1 ) ? true : false;

    /* 親要素に -child: があるか、子要素に -parent: があるときは、追加に制約がある */
    if( child || parent ) {
      permission = false;
    }

    /* -child: の対象リストをつくる */
    if( child ) {

      children = targetParentClass.split( ' ' );
      if( children.length > 1 ) {

        children = $.grep( children, function( elem, index ){
          return ( elem.indexOf( '-child' ) > -1 ) ? true : false;
        } );
        children = $.map( children, function( elem, index ){
          return elem.replace( '-child:', '' );
        } );
      }

      $( children ).each( function(){
        if( componentClass.indexOf( this ) > -1 ) { /* -child: の class が含まれているかどうか */
          permission = true; /* ここに追加していい */
        }
      });

    }

    /* -parent: の対象リストをつくる */
    if( parent ) {

      parents = componentClass.split( ' ' );
      if( parents.length > 1 ) {

        parents = $.grep( parents, function( elem, index ){
          return ( elem.indexOf( '-parent' ) > -1 ) ? true : false;
        } );
        parents = $.map( parents, function( elem, index ){
          return elem.replace( '-parent:', '' );
        } );
      }

      $( parents ).each( function(){

        if( targetParentClass.indexOf( this ) > -1 ) { /* -parent: の class が含まれているかどうか */
          permission = true; /* ここに追加していい */
        }

      });

    }

    return permission;

  },

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

    dialog.find( '.hrcss-dialog-ok' ).focus();

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

    dialog.find( '.hrcss-alert-ok' ).focus();

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

    var wysiwyg = $( '.-wysiwyg' );

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
              items = $( '.-block' );
            } else if( element ) {
              items = $( '.-element' );
						} else if( tbody ) {
              items = $( '.-tbody' );
            } else if( tr ) {
              items = $( '.-tr' );
            } else if( td ) {
              items = $( '.-td' );
            } else if( listitem ) {
              items = $( '.-listitem' );
            }

						sortableOption = $.extend( {}, sortableOption, {
							items: componentSelector,
							connectWith: wysiwyg,
							forceHelperSize: true,
							forcePlaceholderSize: true,
							placeholder: 'hrcss-sortable-placeholder',
							start: function( event, ui ){
                _this.hovering = true;
								$( '.hrcss-sortable-placeholder' ).width( ui.item.outerWidth( true ) );
							},
							stop: function( event, ui ){
                _this.hovering = false;
								$( '.hrcss-picker-tab-content' ).sortable( "destroy" );
							}
						} );

						/* Picker の sortable を有効にする */
						$( '.hrcss-picker-tab-content' ).sortable( sortableOption );


						sortableOption = $.extend( {}, sortableOption, {
							items: items,
							forceHelperSize: true,
							forcePlaceholderSize: true,
              start: function( event, ui ){
                _this.hovering = true;
              },
							stop: function( event, ui ){
                _this.hovering = false;
								wysiwyg.sortable( "destroy" );
							},
							receive: function( event, ui ){ /* コンポーネントがドロップされたとき */

								if( _this.permission( ui.item, component ) ) { /* 制約はなく、追加できるなら */

                  /* コンポーネントを追加する */

                  if( td ) { /* セル（列）の追加なら、ほかの行にも追加する */

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
                      if( _td.eq( _index ).length === 0 ) { /* ui.item が子要素に含まれると、_td.length の値が変わる */
                        _td.eq( _index - 1 ).after( _tmp ); /* after で追加する */
                      } else {
                        _td.eq( _index ).before( _tmp ); /* before で追加する */
                      }

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

                _this.hovering = false;
								wysiwyg.sortable( "destroy" );
								$( '.hrcss-picker-tab-content' ).sortable( 'cancel' );

							}
						} );

						/* 本文 の sortable を有効にする */
						wysiwyg.sortable( sortableOption );

					} );


			} );

		} );


		/* 保存ボタンがクリックされたとき */

		picker.find( '.hrcss-picker-control-save' )
			.on( 'click', function( event ){

				/* 不要なセレクタの削除 */
				$( '.hrcss-hover' ).removeClass( '.hrcss-hover' );

				/* 編集中なら終了する */
				if( _this.status() ) {
					$( '.hrcss-editInPlace-dialog' ).find( '.hrcss-editInPlace-ok' ).trigger( 'click' );
				}

				/* sortable を破棄する */
				if( wysiwyg.hasClass( 'ui-sortable' ) ) {
          _this.hovering = false;
					wysiwyg.sortable( "destroy" );
				}

				/* HTML を表示する */
				wysiwyg.each( function(){

					var _text = $( this ).html();
					_text = $( '<textarea rows="20" cols="100">' ).html( _text );
					_this.alert( _text, function(){} );

				} );

			} );


		/* ページ上部に Picker ぶんの余白をとる */
		$( 'body' ).css( { 'padding-top' : picker.outerHeight( true ) } );

    /* スクロールバーを有効にする */
    if( $( '.hrcss-picker-tab-content' ).outerWidth( true ) - $( window ).width() - 150 < 0 ) {
      $( '.hrcss-picker-tab-content').css( { 'width' : $( window ).width() - 150 } );
    }

		/* イベントの設定 */

		$( document )


			/* リンクの動作を停止（mousedownとは別にclickイベントを止める必要がある） */

      .on( 'click', 'a, :submit', function( event ){
        event.preventDefault();
      } )


			/* 見た目のフォーカスを整える */

			.on( 'mouseenter', '.-block, .-element, .-listitemm, .-tr, .-td, .-editable, [class*=-attribute]', function( event ){
        event.stopPropagation();
        if( !_this.status() && !_this.hovering ){ /* 要素の編集や移動中に hover を効かせない */
          $( this ).addClass( 'hrcss-hover' );
        }
			} )
			.on( 'mouseleave', '.-block, .-element, .-listitem, .-tr, .-td, .-editable, [class*=-attribute]', function( event ){
        event.stopPropagation();
				$( this ).removeClass( 'hrcss-hover' );
			} )


      /* クリックしたときに、対象によって動きを分岐する */

			.on( 'mousedown', '.-block, .-element, .-listitem, .-td, .-editable, [class*=-attribute]', function( event ){

				event.stopPropagation();

        var $this = $( this );

        var block = $this.hasClass( '-block' ),
            element = $this.hasClass( '-element' ),
            listitem = $this.hasClass( '-listitem' ),
            td = $this.hasClass( '-td' ); /* -tr は outline の表示のみに利用 */ /* -tr は outline の表示のみに利用 */


        $( '.hrcss-hover' ).removeClass( 'hrcss-hover' ); /* hoverは解除 */

				var action = false; /* イベントの発生源が editInPlace ダイアログかどうか */
        if( $( event.target ).closest( '.hrcss-editInPlace-dialog' ).length ) {
          action = true;
        } else if( $( event.target ).closest( '.hrcss-editInPlace-textarea' ).length ) {
          action = true;
        }

				if( action ) { /* イベントの発生源が editInPlace ダイアログ */

          _this.dblclick = false; /* ダブルクリックを初期化 */
          _this.pointer = {}; /* ポインタを空にする */
          $( '.hrcss-focus' ).removeClass( 'hrcss-focus' ); /* focusは解除 */
          $( '.hrcss-sortable-handle' ).remove(); /* 取っ手は解除 */


				} else {


					if( !_this.status() ) { /* editInPlace ダイアログが開いていなければ */

						if( _this.pointer === this ) { /* 前のクリックも同じ要素なら */

							_this.dblclick = true; /* ダブルクリックを有効化 */


						} else { /* 前のクリックは別の要素だったら */

              $( '.hrcss-focus' ).removeClass( 'hrcss-focus' ); /* focusを解除 */
              $( '.hrcss-sortable-handle' ).remove(); /* 取っ手は解除 */

		      	  _this.pointer = this; /* 新しいポインタを記録する */

							$( _this.pointer ).addClass( 'hrcss-focus' ); /* 今回クリックしたものにフォーカスをつける */

						} /* / if( _this.pointer === this ) */


      			/* 移動できるもののときは、移動可能先を洗い出し、sortableにする */

            if( block || element || listitem || td ) {

      				var sortableOption2 = {

                forceHelperSize: true,
                forcePlaceholderSize: true,
                placeholder: 'hrcss-sortable-placeholder',

                start: function( event, ui ){
                  _this.hovering = true;
                  _this.dblclick = false; /* ダブルクリックを初期化 */
                },

      					stop: function( event, ui ){ /* 削除 */

                  /* 領域外にドラッグされていたら、要素を削除する */
      						var _wysiwyg = $( event.target ); /* かならず .ui-sortable を指す */
      						var _uiBottom = ui.offset.top + ui.item.outerHeight();
      						var _uiRight = ui.offset.left + ui.item.outerWidth();
      						var _mainBottom = _wysiwyg.offset().top + _wysiwyg.outerHeight();
      						var _mainRight = _wysiwyg.offset().left + _wysiwyg.outerWidth();

      						if( ( _wysiwyg.offset().top - 50 > _uiBottom ) || ( ui.offset.left > _mainRight + 50 ) || ( ui.offset.top > _mainBottom + 50 ) || ( _wysiwyg.offset().left - 50 > _uiRight ) ){ /* '50px' : little wider is better. */

      							_this.dialog( '削除してもよろしいですか？', function(){
      								ui.item.remove();
      							} );

      						}

                  /* 追加する権限のないコンポーネントが並びかえられてきたら、キャンセルする */
                  if( !_this.permission( ui.item, ui.item ) ){
                    _this.alert( 'そのコンポーネントは、ここに追加できません。', function(){} );
                    wysiwyg.sortable( 'cancel' );
                  }

                  _this.hovering = false; /* 要素の移動中ではなくする */
                  _this.pointer = {}; /* ポインタを空にする */
                  $( '.hrcss-focus' ).removeClass( 'hrcss-focus' ); /* focusは解除 */
                  $( '.hrcss-sortable-handle' ).remove(); /* 取っ手は解除 */

                  wysiwyg.sortable( "destroy" );

      					}

      				} /* / sortableOption2 */

              var items;
              if( block ) {
                items = $( '.-block' );
              } else if( element ) {
                items = $( '.-element' );
              } else if( listitem ) {
                items = $( '.-listitem' );
              } else if( td ){
                items = $( '.-td' );
              }


              /* .sortable しやすくするための取っ手 */
              var sortableHandler = _this.systemTemplates.find( '.hrcss-sortable-handle' ).clone();
              $this.prepend( sortableHandler );

              sortableOption = $.extend( {}, sortableOption, sortableOption2, {
                items: items
              } );
              /* 本文 の sortable を有効にする */
              wysiwyg.sortable( sortableOption );

            } /* / if( block || element || listitem || td ) */


          } /* / if( !_this.status() ) */


        } /* / if( action ) */


			} )



			/* EditInPlace で編集する */

			.on( 'click', '.-editable, [class*=-attribute]', function( event ){

				if( _this.dblclick ) { /* for accessibility : 'dblclick' event is not accessible. */

					if( !_this.status() && !_this.hovering ) { /* 同時に編集できるのは1つのみ && 要素の移動中に EditInPlace を効かせない */

						var $this = $( this );

						var originalText = '',
								ins, tagName, text, textarea, attrTable, attrTr;

						var editable = $this.hasClass( '-editable' ),
								attribute = ( $this.attr( 'class' ).indexOf( '-attribute' ) > -1 ) ? true : false;
						var attributes;

						/* -attribute:の対象リストをつくる */
						if( attribute ) {
							attributes = $this.attr( 'class' ).split( ' ' );
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

						/* EditInPlace : OK & Cancel Button */

						ins.append( _this.systemTemplates.find( '.hrcss-editInPlace-control' ).clone() );


            $( '.hrcss-focus' ).removeClass( 'hrcss-focus' ); /* focusを解除 */

            /* .sortable が起動していたら */
            if( wysiwyg.hasClass( 'ui-sortable' ) ) {

              $( '.hrcss-sortable-handle' ).remove(); /* 取っ手は解除 */
              wysiwyg.sortable( "destroy" ); /* .sortableを破棄 */ 

            }


						/* EditInPlace : TextArea */

						if( editable ) {

							text = $this.html();
							originalText = text; /* 元のテキストを保存（キャンセル用） */
							text = $.trim( text );
							text = text.replace( /<br.*?>/g, "\n" ); /* @TODO <br class="hidden-xs">などで困る */

							textarea = _this.systemTemplates.find( '.hrcss-editInPlace-textarea' ).clone();
							textarea.width( '85%' ).height( $this.outerHeight() ); /* 幅は、広くても、狭くても使いづらいケースがあり、85% くらいがバランスがよい */
							textarea.val( text );

							/* 表示 */
							$this.text( '' );
							$this.append( textarea );
							textarea.focus();

						}


						/* EditInPlace : Attributes */

						if( attribute ) {

							attrTable = _this.systemTemplates.find( '.hrcss-editInPlace-attrTable' ).clone();
							attrTr = attrTable.find( 'tr' ).clone();
							attrTable.remove( 'table' ).empty();

							for( var _key in attributes ){

								var _tr = $( $( attrTr ).clone() );
								_tr.find( 'label' ).text( attributes[ _key ] );

								var _val = $this.attr( attributes[ _key ] );
								/* @TODO class属性のとき、hrcssまでさわれてしまう */

								_val = _val.replace( 'hrcss-focus', '' ); /* フォーカスの CSS を外す */
								_val = $.trim( _val );

								_tr.find( 'input' ).attr( 'name', attributes[ _key ] ).val( _val || '' );
								attrTable.append( _tr );

							}

							ins.prepend( attrTable );

						}


						/* 表示 */
						$this.after( ins );


						/* OKボタンがクリックされたとき または その他の要素がクリックされたとき */

						$( '.hrcss-editInPlace-ok', ins )
							.on( 'click', function( event ){

								var _text;

								/* EditInPlace : TextArea */

								if( editable ){

									_text = textarea.val();
									_text = $.trim( _text );
									_text = _text.replace( /\r\n/g, "<br>" ).replace( /(\r|\n)/g, "<br>" );
									$this.html( _text );

								}

								/* EditInPlace : Attributes */

								if( attribute ){

									attrTable.find( 'tr' ).find( 'input' ).each( function(){

										$this.attr( $( this ).attr( 'name' ), ( $( this ).val() || $( this ).text() ) );

									} );

								}

								ins.remove();


							} )


						/* キャンセルボタンがクリックされたとき */

						$( '.hrcss-editInPlace-cancel', ins )
							.on( 'click', function( event ){

								/* EditInPlace : TextArea */

								if( editable ){

									$this.html( originalText );

								}

								/* EditInPlace : Attributes */

								if( attribute ){}

								ins.remove();

							} )


						} /* / if( !_this.status() && !_this.hovering ) */

					} /* / if( _this.dblclick ) */


			} )


			.on( 'keydown', function( event ){

				var _ctrlKey;

				var block = $( _this.pointer ).hasClass( '-block' ),
						element = $( _this.pointer ).hasClass( '-element' ),
            listitem = $( _this.pointer ).hasClass( '-listitem' ),
            td = $( _this.pointer ).hasClass( '-td' );

				if( !_this.status() ){ /* 'input' 'textarea' 入力中と競合しないように */

					_ctrlKey = ( event.ctrlKey === true || event.metaKey === true ) ? true : false;

					if( block || element || listitem || td ) {

						if( _ctrlKey && event.keyCode === 67 ) { /* CTRL+C */

							_this.clipboard = $( _this.pointer ).clone();

						} else if( _ctrlKey && event.keyCode === 88 ){ /* CTRL+X */

							_this.clipboard = $( _this.pointer ).clone();
							_this.pointer.remove();

						} else if( _ctrlKey && event.keyCode === 86 ) { /* CTRL+V */

							var _paste = $( _this.clipboard ).clone();

              var _permission = false;

              if( block ) {

                if( $( _paste ).hasClass( '-block' ) ) {
                  _permission = true;
                } else if( $( _paste ).hasClass( '-element' ) ) {
                  _permission = true;
                }

              } else if( element ) {

                if( $( _paste ).hasClass( '-element' ) ) {
                  _permission = true;
                }

              } else if( listitem ) {

                if( $( _paste ).hasClass( '-listitem' ) ) {
                  _permission = true;
                }

              } else if( td ) {

                if( $( _paste ).hasClass( '-td' ) ) {
                  _permission = true;
                }

              }

              /* -child: と -parent: のチェック */
              if( _permission ) {
                _permission = _this.permission( $( _this.pointer ), $( _paste ) );
              }

              if( _permission ) { /* 制約はなく、追加できるなら */

  							$( _this.pointer ).after( _paste );
  							$( _this.pointer ).removeClass( 'hrcss-focus' );
                $( '.hrcss-sortable-handle' ).remove(); /* 取っ手は解除 */
						    _this.pointer = _paste; /* ペーストしたものにフォーカスを移す */

              } else {
                _this.alert( 'そのコンポーネントは、ここに追加できません。', function(){} );
              }

						} else if( event.keyCode === 46 || event.keyCode === 8 ) { /* Del || BackSpace */

								_this.dialog( '削除してもよろしいですか？', function(){

									$( _this.pointer ).remove();
                  _this.pointer = {}; /* ポインタを空にする */

								} );


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


