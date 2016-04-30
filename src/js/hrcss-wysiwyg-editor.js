/**
 * WYSIWYG HTML Editor for Human Readable CSS
 * last Update: 2016/4/30 @storywriter
 *
 * Require libraries:
 * jquery v1.10.2
 * jquery-ui v1.10.3
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



var hrcssWysiwygEditor = {

	pointer: {},

	status: function(){
		return ( $( '.hrcss-editInPlace-dialog' ).length > 0 ) ? true : false; /* true : 編集起動中 , false : 編集未起動 */
	},

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

		dialog.find( '.hrcss-dialog-message' ).text( message );

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

	init: function(){
		
		var _this = this;

		var sortableOption = {
			forceHelperSize: true,
			opacity: 0.5,
			forcePlaceholderSize: true,
			placeholder: "hrcss-wysiwyg-sortable-placeholder",
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

				componentSelector
					.on( 'mousedown', function( event ){

						var sortableOptionPicker = {
							remove: function( event, ui ){

							},
							stop: function( event, ui ){
								$( '.hrcss-picker-tab-content' ).sortable( "destroy" );
							}
						}

						sortableOption = $.extend( {}, sortableOption, sortableOptionPicker, {
							items: componentSelector,
							connectWith: $( '.-wysiwyg' )
						} );

						$( '.hrcss-picker-tab-content' ).sortable( sortableOption );


						sortableOptionWysiwyg = {}

						sortableOption = $.extend( {}, sortableOption, sortableOptionWysiwyg, {
							items: "> .-block",
							connectWith: $( '.-wysiwyg' ),
							stop: function( event, ui ){
								$( '.-wysiwyg' ).sortable( "destroy" );
							},
							receive: function( event, ui ){
								ui.item.after( component.clone() );
								$( '.-wysiwyg' ).sortable( "destroy" );
								$( '.hrcss-picker-tab-content' ).sortable( 'cancel' );
							}
						} );
						$( '.-wysiwyg' ).sortable( sortableOption );



					} );


			} );

		} );

		/* ページ上部に Picker ぶんの余白をとる */
		$( 'body' ).css( { 'padding-top' : picker.outerHeight( true ) } );


		/* イベントの設定 */

		$( document )

			/* 見た目のフォーカスを整える */

			.on( 'mouseenter', '.-block, .-element, .-editable, [class*=-attribute]', function( event ){
				$( this ).addClass( 'hrcss-wysiwyg-hover' );
			} )

			.on( 'mouseleave', '.-block, .-element, .-editable, [class*=-attribute]', function( event ){
				$( this ).removeClass( 'hrcss-wysiwyg-hover' )
			} )

      .on( 'click', '.-block, .-element, .-editable, [class*=-attribute]', function( event ){
        event.preventDefault(); /* リンクの動作を停止（mousedownとは別にclickイベントを止める必要がある） */
      } )

			.on( 'mousedown', '.-block, .-element, .-editable, [class*=-attribute]', function( event ){

				$( '.hrcss-wysiwyg-hover' ).removeClass( 'hrcss-wysiwyg-hover' ); /* hoverは解除 */

				if( _this.pointer !== event.target ) { /* 今回クリックしたものが、前回クリックしたもの以外だった */

					$( _this.pointer ).removeClass( 'hrcss-wysiwyg-focus' ); /* 前回クリックしたもの */

          _this.pointer = event.target; /* 新しいポインタを記録する */
					$( _this.pointer ).addClass( 'hrcss-wysiwyg-focus' ); /* 今回クリックしたもの */

				}

      } )


			/* 移動できるもののときは、移動可能先を洗い出し、sortableにする */

			.on( 'mousedown', '.-block, .-element', function( event ){

				var target = event.target;
				var $target = $( target );

				var sortableOptionWysiwyg = {

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

						$( '.-wysiwyg' ).sortable( "destroy" );
					}
				}


				var block = $target.hasClass( '-block' ),
						element = $target.hasClass( '-element' );

				if( block ) {

					sortableOption = $.extend( {}, sortableOption, sortableOptionWysiwyg, {
						items: "> .-block",
						connectWith: $( '.-wysiwyg' )
					} );
					$( '.-wysiwyg' ).sortable( sortableOption );

				} else if( element ) {

					sortableOption = $.extend( {}, sortableOption, sortableOptionWysiwyg, {
						items: ".-element",
						connectWith: $( '.-block' )
					} );
					$( '.-wysiwyg' ).sortable( sortableOption );

				}


			} )


			/* EditInPlace で編集する */

			.on( 'click', '.-editable, [class*=-attribute]', function( event ){

				var target = event.target;
				var $target = $( target );

				var originalText = '',
						ins, tagName, text, textarea, table, tr;

				var editable = $target.hasClass( '-editable' ),
						attribute = ( $target.attr( 'class' ).indexOf( '-attribute' ) > -1 ) ? true : false;

				/* -attribute:の対象リストをつくる */
				var attributes = $target.attr( 'class' ).split( ' ' );
				if( attributes.length > 1 ) {

					attributes = $.grep( attributes, function( elem, index ){
						return ( elem.indexOf( '-attribute' ) > -1 ) ? true : false;
					} );
					attributes = $.map( attributes, function( elem, index ){
						return elem.replace( '-attribute:', '' );
					} );
				}


				/* EditInPlace : Dialog */

				ins = _this.systemTemplates.find( '.hrcss-editInPlace-dialog' ).clone();

				/* EditInPlace : OK & Cansel Button */

				ins.append( _this.systemTemplates.find( '.hrcss-editInPlace-control' ).clone() );


				/* EditInPlace : TextArea */

				if( editable ){

					tagName = $target.context.tagName;

					if( tagName !== 'IMG' && tagName !== 'HR' ){ /* img でも hr でもなければ */

						text = $target.html();
						originalText = text; /* 元のテキストを保存（キャンセル用） */
						text = $.trim( text );
						text = text.replace( /<br.*?>/g, "\n" ); /* @TODO <br class="hidden-xs">などで困る */

						textarea = _this.systemTemplates.find( '.hrcss-editInPlace-textarea' ).clone();
						textarea.width( $target.width() ).height( $target.height() );
						textarea.val( text );

						$target.text( '' );
						$target.append( textarea );

						textarea.focus();

					}

				}


				/* EditInPlace : Attributes */

				if( attribute ){

					table = _this.systemTemplates.find( '.hrcss-editInPlace-attrTable' ).clone();
					tr = table.find( 'tr' ).clone();
					table.remove( 'table' ).empty();

					for( var _key in attributes ){

						var _tr = $( $( tr ).clone() );
						_tr.find( 'label' ).text( attributes[ _key ] );

						var _val = $target.attr( attributes[ _key ] );
						/* @TODO class属性のとき、hrcssまでさわれてしまう */

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

							$target.text( originalText );

						}

						/* EditInPlace : Attributes */

						if( attribute ){}

						ins.remove();

					} )



			} )


			.on( 'keydown', function( event ){

				var _ctrlKey;

				if( !_this.status() ){ /* 'input' 'textarea' 入力中と競合しないように */

					_ctrlKey = ( event.ctrlKey === true || event.metaKey === true ) ? true : false;

					if( _ctrlKey && event.keyCode === 67 ){ /* CTRL+C */

						_this.clipboard = $( _this.pointer ).clone();

					} else if( _ctrlKey && event.keyCode === 88 ){ /* CTRL+X */

						_this.clipboard = $( _this.pointer ).clone();
						_this.pointer.remove();

					} else if( _ctrlKey && event.keyCode === 86 ){ /* CTRL+V */

						$( _this.pointer ).after( $( _this.clipboard ).clone() )

					} else if( event.keyCode === 46 || event.keyCode === 8 ){ /* Del || BackSpace */

						_this.dialog( '削除してもよろしいですか？', function(){
							_this.pointer.remove();
						} );
						if( event.keyCode === 8 ){ return false; } /* Disable 'Page Back' on the 'BackSpace' key */

					} else if( _ctrlKey && event.keyCode === 90 ){ /* CTRL+Z */
						/* ToDo: UnDo Function */

					} else if( _ctrlKey && event.keyCode === 89 ){ /* CTRL+Y */
						/* ToDo: ReDo Function */

					} else {
					}

				}

			});


	}

}

document.hrcssWysiwygEditor = hrcssWysiwygEditor;

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


