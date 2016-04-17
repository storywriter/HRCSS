# Human Readable CSS
Human Readable CSS with WYSIWYG HTML Editor, apply to Web Components.

人間に読みやすいコンポーネント指向のCSS記述法

そのまま使える WYSIWYG HTML Editor を含む。
Web Components 技術にも対応している。


## 原則

- 人間にとって読みやすいこと。


- シンプルに使うことができること。

- スタイルシートの知識だけで、コンポーネントが作成できること。すなわち JavaScript がわからないウェブ制作者にも、コンポーネントが作成できること。本仕様中には、HTML5 の data 属性を用いれば、もっとシンプルになる箇所は多々ある。しかし、本仕様では、できるかぎり class 属性のなかに押し込めた。つまり「CSSの世界」のなかに閉じることで、JavaScript を知らないウェブ制作者にも、CSSの知識さえあれば、コンポーネントの編集まではできるようにした。

これは、本仕様が、何十人、何百人というような大人数で、何年も運用していくような、大規模な制作現場でも耐えられることを目指しているからである。大規模な環境での制作になるほど、個人ごとのスキルに跛行があり、時間とともにメンバーは入れ替わる。すべての制作者が JavaScript をしっかりと理解していることなど、大規模な現場ではあり得ない。

- HTML/CSS実装の、ベストプラクティスの集積であること。

- HTMLおよびCSSが、W3Cの仕様でいうところの「堅牢」であること。すなわち、HTMLおよびCSSが Valid であること。

- 広く普及した技術で操作できること。具体的には jQuery で操作できること。

- できるだけ依存する JavaScript ライブラリを少なくすること。具体的には、WYSIWYG HTML Editor が依存するのは jQuery 本体と jQuery UI Core、そして jQuery UI Interactions Sortable の3つのライブラリのみである。これは、WYSIWYG HTML Editor がさまざまな用途、とくに、さまざまなCMSの管理画面から呼び出されることを想定しており、そのときに他ライブラリとの競合を最小限に抑えるためである。

- コンポーネント指向であること。「Web Components」という意味ではなく、いわゆる制作現場て用いられる、インタフェースの最小要素としてのコンポーネントを指す。

- コンポーネントの用途と、ネストできる要素を定義できること。

- Web Components にもシームレスに対応していること。

- 既存のHTML/CSSと同居できること。大規模な環境ほど、一夜にしてすべてのコンテンツを移行できるなどあり得ない。ふつうのHTML/CSSと混在することができること。

- わかりやすいサンプルとして Bootstrap と Font Awesome ですぐ利用できること。


CSSが大規模運用でからまるのは、よく「スコープ定義がない」からである、と言われるが、これは勘違いである。仮にスコープがあっても、ある要素の再利用には、それが何のために、どこから呼び出されるものであるかが、わからないければ、再利用できない。CSSが読みやすいためには、次の2点が要る。組み合わせてコンポーネントにしたとき、それ自身の用途を説明するすべがあること。そのコンポーネントにネストできる要素を定義できること。

世の中で、「スタイルガイド」「エレメント一覧表」「コンポーネント集」「モジュールリスト」といった名前で呼ばれる一覧のものは、多くある。各組織、各プロダクトごとに存在していることある。そして、その多くが、うまく運用できないという悩みを抱えている。その大きな原因は、「部品」だけを提供していることだ。部品をどのように使うか、そしてどのように使ってはいけないか、ネストしてよい要素は何か、ネストしてはいけない要素は何か、それらの情報がなければ、スタイルガイドを正しく運用することはできない。なぜなら、スタイルガイドで提供される部品の大きさは、その対象となるプロダクトによって異なるからだ。たとえば Bootstrap で定義されている部品は、さまざまなウェブサイトに適用できるよう、自由度が大きく設計されている。だから、Bootstrap のスタイルガイドをそのまま参考にして、あるプロダクトに限定されたスタイルガイドをつくろうとすると、けっきょくはなんでもできてしまう、自由度が高すぎるスタイルガイドができてしまう。あるプロダクトに限定されたスタイルガイドをつくるには、もっともっとコードを固定して、部品を限定したものにしなければならない。このように、スタイルガイドには粒度があり、それを定義する情報が要る。

しかし、CSSの標準の文法には、その制約を記述するための方法がない。そのため、多くの組織では、別のガイドラインとして、そのルール集を用意する。そうすると、制作者は、ものをつくるときに、複数のドキュメントを参照せねばならず、こんがらがったり、面倒くさがったりして、けっきょくはスタイルガイドは守られない。より正しく言うと、別のガイドラインを参照させるということ自体が、制作の現場としては難易度が高すぎる、非現実的に近い作業なのである。

この問題を解決するためには、スタイルの定義そのものが、そのコンポーネントが何者であるか、ネストできる要素が何であるか、CSSの中に記述するようにする。そこだけを見れば、それが何者であるか、明らかであるようにする。



思想：

1. セレクタ名は、制作者への指示を書く（システムが読むためだけであれば、セレクタ名は a, b, c... でかまわないはず）
2. コンポーネント単位で運用する

<style>

._ {}
.component {}
.with-text {}
.with-flow {}
.with-component {}

</style>


Component Based & Human Readable CSS



<h1 class="h1 _ component with-text">Lorem ipsum dolor sit amet</h1> <p class="lead _ component with-text"><em>Lorem</em> ipsum dolor sit amet, consectetur adipisicing elit,</p>

<div class="textAndImage1 _ component">

        <div class="left _ with-flow">

                <p>Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut</p>
                <ol>
                        <li>labore et dolore magna aliqua.</li>
                        <li>Ut enim ad minim veniam,</li>
                </ol>
                <p>quis nostrud exercitation ullamco laboris nisi ut</p>
                <p class="arrow _ component"><a href="#" class="_ with-text">aliquip ex ea commodo consequat.</a></p>

        </div>

        <div class="right">

                <p><a href="#" class="_ optional-wrap"><span class="_ with-image"><img src="..."></span><span class="_ with-text optional-element">Duis aute irure</span></a></p>

        </div>

</div>

<div class="textAndImage2 _ component">

        <div class="left _ with-flow">

                <p>Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut</p>

        </div>

        <div class="right _ with-component-imageWithCaption1 with-component-imageWithCaption2">

                <p class="imageWithCaption1 _ component"><a href="#" class="_ optional-wrap"><span class="_ with-image"><img src="..."></span><span class="_ with-text">Duis aute irure</span></a></p>

        </div>

</div>



自明のコンポーネント：
<p>
<em>
<ol>...</ol>


気になること：
<table>


HTML5では、以下はValidになる。
XHTML1.0 Transitionalでも、&以外はValidになる。


<!DOCTYPE html>
<html>
<head>
<title>Test</title>
</head>

<body>

<div class="日本語">Test1</div>
<div class="|">Test2</div>
<div class="_">Test3</div>
<div class="-">Test4</div>
<div class=".">Test5</div>
<div class="'">Test6</div>
<div class="[">Test7</div>
<div class="(">Test8</div>
<div class="{">Test9</div>
<div class="/">Test10</div>
<div class="?">Test11</div>
<div class="*">Test12</div>
<div class="#">Test13</div>
<div class="!">Test14</div>
<div class="@">Test15</div>
<div class="=">Test17</div>
<div class="~">Test18</div>
<div class=",">Test19</div>
<div class=":">Test20</div>
<div class=";">Test21</div>
<div class="+">Test22</div>
<div class="    ">Test23</div>
<div class="%">Test24</div>
<div class="&">Test25</div>
<div class="$">Test26</div>

<div class="\\">Test99</div>


</body>
</html>


Human Directive CSS
Human Centered CSS
Human Readable CSS



アイデア <h1 class="h1 (component) (with:text)">

わかりやすいが、jQueryで操作できない。HTMLとしてはValid。
JavaScript系のテンプレートエンジンとのかかわりも気になる。

(component) → -component ならjQueryも動く。またはスペースなら、ふつうのセレクタになる。

<h1 class="h1 -component -with-text">
<h1 class="h1 ( component with-text )">
<h1 class="h1 || component with-text">


<div class="(with: imageWithCaption1 )">
と
<div class="imageWithCaption1">
が、jQueryで同じに扱われると困る


<h1 class="h1 ( component -text -imageWithCaption1 )">
可読性を考えると
<h1 class="h1 ( component with-text with-imageWithCaption1 )">
<h1 class="h1 ( component with: -text -imageWithCaption1 )">
<h1 class="h1 ( component include: -text -imageWithCaption1 )"> ←これ読みやすい！
<h1 class="h1 ( component include- -text -imageWithCaption1 )"> ←jQueryで扱える
<h1 class="h1 ( component include : -text -imageWithCaption1 )"> ←jQueryで扱える
<h1 class="h1 ( component include : -text -imageWithCaption1 , anything : -something -else )"> ←jQueryで扱える




<h1 class="h1 (component) (with:text)">Lorem ipsum dolor sit amet</h1> <p class="lead (component) (with:text)"><em>Lorem</em> ipsum dolor sit amet, consectetur adipisicing elit,</p>

<div class="textAndImage1 (component)">

        <div class="left (with:flow)">

                <p>Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut</p>
                <ol>
                        <li>labore et dolore magna aliqua.</li>
                        <li>Ut enim ad minim veniam,</li>
                </ol>
                <p>quis nostrud exercitation ullamco laboris nisi ut</p>
                <p class="arrow (component)"><a href="#" class="(with:text)">aliquip ex ea commodo consequat.</a></p>

        </div>

        <div class="right">

                <p><a href="#" class="(optional:wrap)"><span class="(with:image)"><img src="..."></span><span class="(text) (optional:element)">Duis aute irure</span></a></p>

        </div>

</div>

<div class="textAndImage2 (component)">

        <div class="left (with:flow)">

                <p>Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut</p>

        </div>

        <div class="right (with:imageWithCaption1,imageWithCaption2)">

                <p class="imageWithCaption1 (component)"><a href="#" class="(optional:wrap)"><span class="(with:image)"><img src="..."></span><span class="(with:text)">Duis aute irure</span></a></p>

        </div>

</div>


