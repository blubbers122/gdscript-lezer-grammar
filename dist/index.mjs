// src/parser.js
import { LRParser } from "@lezer/lr";

// src/tokens.js
import { ContextTracker, ExternalTokenizer } from "@lezer/lr";

// src/parser.terms.js
var indent = 148;
var dedent = 149;
var newline = 150;
var blankLineStart = 151;
var newlineBracketed = 152;
var eof = 153;
var ParenL = 10;
var CallParamsLiteralExpressionNode = 11;
var CallParamsExpressionNode = 25;
var ArrayExpressionNode = 41;
var BracketL = 47;
var CallExpressionNode = 71;
var DictionaryExpressionNode = 75;
var BraceL = 76;
var GroupedExpressionNode = 78;
var CallParamsParameterNode = 82;

// src/tokens.js
var bracketed = /* @__PURE__ */ new Set([
  GroupedExpressionNode,
  ArrayExpressionNode,
  DictionaryExpressionNode,
  CallExpressionNode,
  CallParamsExpressionNode,
  CallParamsLiteralExpressionNode,
  CallParamsParameterNode
]);
var newline2 = "\n".charCodeAt(0);
var carriageReturn = "\r".charCodeAt(0);
var space = " ".charCodeAt(0);
var tab = "	".charCodeAt(0);
var hash = "#".charCodeAt(0);
var IndentLevel = class {
  constructor(parent, depth) {
    this.parent = parent;
    this.depth = depth;
    this.hash = (parent ? parent.hash + parent.hash << 8 : 0) + depth + (depth << 4);
  }
};
var topIndent = new IndentLevel(null, 0);
function isLineBreak(ch) {
  return ch === newline2 || ch === carriageReturn;
}
var newlines = new ExternalTokenizer(
  (input, stack) => {
    let prev;
    if (input.next < 0) {
      input.acceptToken(eof);
    } else if (stack.context.depth < 0) {
      if (isLineBreak(input.next)) {
        input.acceptToken(newlineBracketed, 1);
      }
    } else if (((prev = input.peek(-1)) < 0 || isLineBreak(prev)) && stack.canShift(blankLineStart)) {
      let spaces = 0;
      while (input.next === space || input.next === tab) {
        input.advance();
        spaces++;
      }
      if (input.next === newline2 || input.next === carriageReturn || input.next === hash) {
        input.acceptToken(blankLineStart, -spaces);
      }
    } else if (isLineBreak(input.next)) {
      input.acceptToken(newline, 1);
    }
  },
  { contextual: true }
);
function countIndent(space2) {
  let depth = 0;
  for (let i = 0; i < space2.length; i++)
    depth += space2.charCodeAt(i) === tab ? 8 - depth % 8 : 1;
  return depth;
}
var trackIndent = new ContextTracker({
  start: topIndent,
  reduce(context, term) {
    return context.depth < 0 && bracketed.has(term) ? context.parent : context;
  },
  shift(context, term, stack, input) {
    switch (term) {
      case indent:
        return new IndentLevel(
          context,
          countIndent(input.read(input.pos, stack.pos))
        );
      case dedent:
        return context.parent;
      case ParenL:
      case BracketL:
      case BraceL:
        return new IndentLevel(context, -1);
      default:
        return context;
    }
  },
  hash(context) {
    return context.hash;
  }
});
var indentation = new ExternalTokenizer((input, stack) => {
  const contextDepth = stack.context.depth;
  if (contextDepth < 0)
    return;
  const prev = input.peek(-1);
  if (!(prev === newline2 || prev === carriageReturn)) {
    return;
  }
  let chars = 0;
  let depth = 0;
  while (true) {
    if (input.next === space) {
      depth++;
    } else if (input.next === tab) {
      depth += 8 - depth % 8;
    } else {
      break;
    }
    input.advance();
    chars += 1;
  }
  if (depth !== contextDepth && input.next !== newline2 && input.next !== carriageReturn && input.next !== hash) {
    if (depth < contextDepth) {
      input.acceptToken(dedent, -chars);
    } else {
      input.acceptToken(indent);
    }
  }
});

// src/highlight.js
import { styleTags, tags as t } from "@lezer/highlight";
var gdscriptHighlighting = styleTags({
  "for while if elif else return break continue pass assert await match case": t.controlKeyword,
  "in not and or is del": t.operatorKeyword,
  "func class class_name extends const var enum signal": t.definitionKeyword,
  "preload load": t.moduleKeyword,
  "as PI TAU INF NaN": t.keyword,
  True: t.bool,
  False: t.bool,
  Null: t.bool,
  Comment: t.lineComment,
  Number: t.number,
  String: t.string,
  UpdateOp: t.updateOperator,
  ArithOp: t.arithmeticOperator,
  BitOp: t.bitwiseOperator,
  CompareOp: t.compareOperator,
  AssignOp: t.definitionOperator,
  "ClassNode/Identifier ClassNode/ExtendsStatement/Identifier VariableNode/TypeCast/Type/Identifier": t.definition(t.className),
  "SignalStatement/Identifier CallExpressionNode/Identifier FunctionNode/Identifier": t.function(t.variableName),
  "( )": t.paren,
  "[ ]": t.squareBracket,
  "{ }": t.brace,
  ".": t.derefOperator,
  ", ;": t.separator,
  // '"*"': t.operator,
  '. ( ) - + "*" "/" "!"  { } [ ] , ; : < > Equal FunctionReturnPointer': t.punctuation,
  // "CallParamsExpressionNode": t.function(t.propertyName),
  "TypeCast/Type/Identifier FunctionReturnType/Type/Identifier ClassNameStatement/Identifier ExtendsStatement/Identifier": t.typeName,
  "AnnotationNode/@ AnnotationNode/Identifier": t.annotation,
  "EnumNode/Identifier ConstantNode/Identifier VariableNode/Identifier SignalStatement/CallParamsExpressionNode/ParameterNode/Identifier AssignmentExpressionNode/Identifier AssignmentExpressionNode/IdentifierExpressionNode/Identifier": t.variableName,
  "ForNode/Identifier SubscriptExpressionNode/FirstVariableName/VariableName/Identifier": t.variableName,
  "SubscriptExpressionNode/VariableName/Identifier": t.propertyName
});

// src/parser.js
var spec_Identifier = { __proto__: null, PI: 34, TAU: 36, INF: 38, NaN: 40, assert: 48, class_name: 62, extends: 66, signal: 70, pass: 74, return: 78, var: 100, const: 104, await: 110, in: 140, as: 146, func: 162, preload: 188, is: 202, class: 220, enum: 224, if: 234, elif: 238, else: 242, for: 246, match: 250, while: 266 };
var parser = LRParser.deserialize({
  version: 14,
  states: "! QQ`QUOOP#uOQOOOOQQ'#Cq'#CqOOQQ'#Ch'#ChO#zQUO'#CbO$PQUO'#CaO&RQYO'#CvOOQQ'#DX'#DXO&oQUO'#DZO&tQUO'#DWO(sQYO'#FuO*kQUO'#DVO*rQYO'#FuO+PQUO'#D_OOQQ'#Fz'#FzO,oQYO'#C`O,|QYO'#D^O-UQUO'#DyO(zQUO'#D|OOQQ'#E_'#E_O(zQUO'#EgOOQQ'#Fu'#FuOOQQ'#C`'#C`O.uQUO'#C_OOQR'#C_'#C_O/QQVO'#EsOOQR'#El'#ElOOQR'#Fo'#FoOOQR'#FW'#FWQ`QUOOOOQQ'#Cl'#ClO1yQUO'#CsO2OQUO'#CzO2TQUO'#C|O2YQUO'#DOOOQQ'#DQ'#DQO2_QUO'#D_O2dQUO'#DaO(zQUO'#DdO2iQUO'#ErO1yQUO'#E]O(zQUO'#DSO2nQUO'#EmO2sQUO'#EoO-UQUO'#EtO2{QUO'#EzO3QQUO'#E|O-UQUO'#FUP3VOUO'#FnPOOO)CAb)CAbO3bQUO,58|O4PQUO'#CwOOQQ,59b,59bO4UQUO'#CuO(zQUO,59xOOQQ,5:a,5:aO4^QYO,59uO6^QUO'#F[O6cQYO,59rO8iQYO'#FyOOQQ,59q,59qO8sQUO,59qOOQQ'#F^'#F^O8xQUO'#D_O9TQUO'#EOO9YQUO,59qO-UQUO,5:eOOQQ-E9[-E9[O9aQUO,59yO9fQUO,59{O9kQUO,5;XO9pQUO,5;^O(zQUO,5:QO(zQUO,5:QO(zQUO,5:QO(zQUO,5:QO(zQUO,5:QO(zQUO,5:QO(zQUO,5:QO(zQUO,5:QO(zQUO,5:QO(zQUO,5:QO(zQUO,5:{O(zQUO,5:QO9uQUO,5:QO4PQUO,5:bO9zQUO,5;OO;ZQYO'#D{O;eQUO'#F|O;mQUO,5:eO;rQYO,5:hOOQQ,5;R,5;ROOQR'#EW'#EWOOQR'#Ei'#EiO;yQUO'#FaO.uQUO,5;UOOQR,58y,58yOOQR'#Fc'#FcO<jQVO,5;_OOQR,5;_,5;_O-UQUO'#EvO?cQUO'#ExOOQR-E9U-E9UOOQQ,59_,59_OOQQ,59f,59fOOQQ,59h,59hO?hQUO,59jO?vQYO,59yO@RQYO,59{OOQQ,5:O,5:OO9TQUO,5;^OOQQ,5:w,5:wO@^QYO,59nO@kQUO,5;XO@sQUO'#EqOOQR,5;Z,5;ZO2vQUO,5;ZO@{QYO,5;`OAVQUO,5;fOA[QUO,5;hO@{QYO,5;pPOOO,5<Y,5<YPAaOQO,5<YPAfOUO,5<YOB`QUO'#CgOOQQ1G.h1G.hOOQQ'#Cy'#CyOOQQ,59c,59cOBgQUO'#CvOBrQUO'#FtOOQQ,59a,59aOBzQUO,59aODWQYO1G/dODzQUO'#FZOEPQYO1G/aOOQQ'#DY'#DYOOQQ,5;v,5;vOOQQ-E9Y-E9YOGPQUO,5<eOGWQUO,5<eOOQQ1G/]1G/]OG`QUO'#EQOGhQbO'#F}OGpQUO,5:jOGuQUO1G/]OGzQUO1G0POHPQYO1G/eOH[QYO1G/gO@kQUO1G0sO9TQUO1G0xOOQQ1G/l1G/lOJZQYO1G/lOJbQYO1G/lOL]QYO1G/lONWQYO1G/lON_QYO1G/lO!!YQYO1G/lO!!aQYO1G/lO!$XQYO1G/lO!$cQYO1G/lO!$mQYO1G0gO!%oQYO1G/lO(zQUO1G/lOOQQ1G/|1G/|OOQQ'#Ef'#EfOOQQ1G0j1G0jO-UQUO,59xO(zQUO,5:gO!&oQUO,5<hO!&vQUO,5<hOOQQ1G0P1G0POOQQ1G0S1G0SOOQQ,5;{,5;{OOQQ-E9_-E9_OOQR1G0p1G0pOOQR-E9a-E9aOOQR1G0y1G0yO@{QYO,5;bO!'OQUO'#EUOOQR,5;d,5;dOOQQ1G/U1G/UOOQQ1G/e1G/eOOQQ1G/g1G/gO?cQUO1G0xOOQR1G0s1G0sO?cQUO1G0sO!'VQUO'#GQOOQR,5;],5;]O!'_QUO,5;]OOQR1G0u1G0uOOQR1G0z1G0zO-UQUO1G1QO!'dQUO1G1SOOQR1G1[1G1[POOO1G1t1G1tP!'iOQO1G1tO!'nQUO'#FpOOQQ,59R,59RO!'vQUO,59RO!'{QUO,5<`O!(TQUO,5<`OOQQ1G.{1G.{OOQQ,5;u,5;uOOQQ-E9X-E9XO!(]QYO,5;wO!(gQUO1G2POOQQ-E9Z-E9ZO!(nQYO'#CvO!)PQYO'#GOO!)_QUO'#GOOOQQ,5:l,5:lO!)gQUO,5:lOOQQ'#ET'#ETO4PQUO'#ESOOQQ,5<i,5<iOOQQ1G0U1G0UOOQQ7+$w7+$wOOQQ7+%k7+%kOOQQ7+%P7+%POOQQ7+%R7+%ROOQR7+&_7+&_O?cQUO7+&_O?cQUO7+&dO(zQUO7+&RO!*gQYO7+%WO!,wQYO1G/dO!-RQYO1G0ROOQQ,5;y,5;yO!-]QUO1G2SOOQQ-E9]-E9]OOQR1G0|1G0|O!-dQVO'#EVOOQR'#E['#E[OOQR,5:p,5:pOOQR7+&d7+&dO!-iQUO,5<lO!-qQUO,5<lOOQR1G0w1G0wO@{QYO7+&lO!-dQVO7+&nPOOO7+'`7+'`O!-yQUO,5<[O!.QQUO,5<[OOQQ1G.m1G.mOOQQ,5;t,5;tO!.YQUO1G1zOOQQ-E9W-E9WP(zQUO'#F]O(zQUO,5:mO!.bQUO,5<jO!.jQUO,5<jOOQQ1G0W1G0WOOQQ,5:n,5:nO!.rQYO'#EsOOQR<<Iy<<IyOOQR<<JO<<JOO!1vQYO<<ImP-UQUO'#F_OOQQ'#EY'#EYO`QUO'#EXOOQR,5:q,5:qOOQQ,5;|,5;|O!2mQUO1G2WOOQQ-E9`-E9`OOQR<<JW<<JWO!2uQUO<<JYOOQQ,5;s,5;sO!3SQUO1G1vOOQQ-E9V-E9VP!3ZQUO'#FYO!3`QYO1G0XO!3jQYO,5;zOOQQ,5;z,5;zO!3xQUO1G2UOOQQ-E9^-E9^O!4QQYO,5;_O!6QQVO,5:sP!6[QUO'#FbOOQQ'#FR'#FROOQQ'#FS'#FSOOQQ'#FT'#FTOOQQ'#FP'#FPO?cQUO'#FOOOQR'#Fd'#FdO!6aQVOAN?tO!6tQUO'#FQPAnQUO'#FXP!6yQUO'#F`OOQR'#EZ'#EZOOQR1G0_1G0_OOQR,5;j,5;jOOQR-E9b-E9bOOQRG25`G25`OOQQ,5;l,5;lO!7OQYO'#CvO-UQUO'#EgO-UQUO'#DdO-UQUO,59xO-UQUO,5:QO-UQUO,5:QO-UQUO,5:QO-UQUO,5:QO-UQUO,5:QO-UQUO,5:QO-UQUO,5:QO-UQUO,5:QO-UQUO,5:QO-UQUO,5:QO-UQUO,5:QO!7]QYO1G/dO!7gQYO1G/lO!8WQYO1G/lO!8wQYO1G/lO!9hQYO1G/lO!:XQYO1G/lO!:xQYO1G/lO!;iQYO1G/lO!=jQYO1G/lO!=tQYO1G/lO!>OQYO1G/lO-UQUO1G/lO!>oQUO'#EUOGpQUO1G0xOGpQUO1G0sOGpQUO7+&_OGpQUO7+&dO-UQUO7+&RO!@kQYO7+%WO!A[QYO7+&lO!BjQYO<<ImO!CQQYO'#D^O!CYQUO,5:QOGpQUO'#ExO9TQUO,5;^O!C_QUO,5;XO!A[QYO,5;`O!A[QYO,5;pO!C_QUO1G0sO9TQUO1G0xO!CgQYO1G0gO!A[QYO,5;bO-UQUO1G1QO!CnQUO'#ErO!CsQUO'#EmO-UQUO'#EtO-UQUO'#FUO!CxQUO,5;XO!C}QUO,5;^O(zQUO,5:{O-UQUO'#EvO!DSQUO,5;fO!DXQUO'#D_O!DjQUO'#Ez",
  stateData: "!EV~OPOS$aOS$^OS$]PQ~OVSOWUOYbO]RO^RO_ROanObnOcnOdnOhoOopOqqOsrOusOwyO!PZO!StO!UuO!XvO!gdO!naO!swO#QxO#ScO#[dO#bzO#d{O#i|O#o}O#q!OO#y!PO$eRO$fRO$gQO$jWO$kWO~O$]!QO~OW!SO~OV$QX!S$QX!U$QX!s$QX#_TX#b$QX$[TX$_TX~OY!VOl!TO!O|X!Z!qX![!qX!]!qX!^!qX!_!qX!`!qX!a!qX!b!qX!c!qX!d!qX!e!qX!f!qX!g!qX!h!qX!k!qX#U!qX#X!qXf!qX!l!qX~O!V!WO$o!WO#_!qX$[!qX$_!qXx!qXX!qX#V!qX~P$kOW!YO~O!O!ZO~O!V$iX!Z$iX![$iX!]$iX!^$iX!_$iX!`$iX!a$iX!b$iX!c$iX!d$iX!e$iX!f$iX!g$iX!h$iX!k$iX#U$iX#X$iX#_$iX$[$iX$_$iX$o$iXf$iXx$iXl$iXX$iX#V$iX!l$iX~O!O!ZO~P&yOVSOWUOYbO]RO^RO_ROanObnOcnOdnO!PZO!StO!UuO!XvO!gdO!naO!s!bO#QxO#ScO#[dO$eRO$fRO$gQO$jWO$kWO~Ox!^O~P(zOY!VO!P!cO!n!dO~P&yOVSO!S!fO!U!gO!s!iO#b!hO~O!V!WO!Z!jO![!kO!]!lO!^!mO!_!nO!`!oO!a!pO!b!qO!c!rO!d!rO!e!sO!f!sO!g!vO!h!uO!k!wO#U!tO#X!xO$o!WO~O#_SX$[SX$_SX~P+bO!V!WO$o!WO~OVSOW'bOYbO]RO^RO_ROanObnOcnOdnO!PZO!StO!UuO!X'dO!g'cO!naO!s!bO#QxO#ScO#['cO$eRO$fRO$gQO$jWO$kWO~O#_#QO$[#OO$_#PO~O#k#WO#m#XOV#gXW#gXY#gX]#gX^#gX_#gXa#gXb#gXc#gXd#gXh#gXo#gXq#gXs#gXu#gXw#gX!P#gX!S#gX!U#gX!X#gX!g#gX!n#gX!s#gX#Q#gX#S#gX#[#gX#b#gX#d#gX#i#gX#o#gX#q#gX#y#gX$X#gX$e#gX$f#gX$g#gX$j#gX$k#gX$Z#gX$_#gX$u#gX~OY!VO~OW#[O~OW#]O~OW#^O~OW#_O~OW#`O~OW#bO~OW#eO~OW#hO!n#fO~OW#jO~OW#kO~OP#nO$[#mO$a#oO~OY#pOVUa!SUa!UUa!sUa#_Ua#bUa$[Ua$_Ua~OW#rO~OW#tOX#vO~O$l#yO!O}a!V}a!Z}a![}a!]}a!^}a!_}a!`}a!a}a!b}a!c}a!d}a!e}a!f}a!g}a!h}a!k}a#U}a#X}a#_}a$[}a$_}a$o}af}ax}al}aX}a#V}a!l}a~OW#{O~O!O!ZOYza!Pza!Vza!Zza![za!]za!^za!_za!`za!aza!bza!cza!dza!eza!fza!gza!hza!kza!nza#Uza#Xza#_za$[za$_za$ozafzaxzalzaXza#Vza!lza~Of$OOx$mX~P+bOx$QO~OVSO!S!fO!U!gO~OY$RO~Ox$QO~P(zOW$WO~OW$XO~OW$YO~OW$ZO~O!h$hO~OW$jO~O!Z'fO!['gO!]'hO!^'iO!_'jO!`'kO!a'lO!b'mO!c'nO!d'nO!e'oO!f'oO!g(XO!h'pO!k!wO#U(jO#X!xO$o'eO~Ol$mO!V$lO~P:POf$nO!l$pX~O!l$pO~OX$qO~P+bOhoOopOqqOsrOusOwyO#_$TX$[$TX$_$TX~P(zO#k#WO#m#XOV#gaW#gaY#ga]#ga^#ga_#gaa#gab#gac#gad#gah#gao#gaq#gas#gau#gaw#ga!P#ga!S#ga!U#ga!X#ga!g#ga!n#ga!s#ga#Q#ga#S#ga#[#ga#b#ga#d#ga#i#ga#o#ga#q#ga#y#ga$X#ga$e#ga$f#ga$g#ga$j#ga$k#ga$Z#ga$_#ga$u#ga~Ol$xO~OY!VO#_ra$[ra$_ra~Ol!TO!V!Ra$o!Ra~Ol!TO!V!Ta$o!Ta~O#_va$[va$_va~P+bOl$xOqqO~OW%QO!l%RO~Ol$xO!V'eO~P:PO!h%VO~Ol%WO~O$[%YO~OP%ZO$[%YO~O]RO^RO_ROanObnOcnOdnO$eRO$fRO$gQO~OX%]O~PAnOl!TOXjXfjX~Of%_OX$hX~OX%aO~O!Z!jO![!kO!]!lO!^!mO!_!nO!`!oO!a!pO!b!qO!c!rO!d!rO!e!sO!f!sO!g!vO!h!uO!k!wO#U!tO#X!xO~O!V!Qi#_!Qi$[!Qi$_!Qi$o!Qif!Qix!QiX!Qi#V!Qi!l!Qi~PCPOW%bO~O$l#yO!O}i!V}i!Z}i![}i!]}i!^}i!_}i!`}i!a}i!b}i!c}i!d}i!e}i!f}i!g}i!h}i!k}i#U}i#X}i#_}i$[}i$_}i$o}if}ix}il}iX}i#V}i!l}i~Ox$ma~P(zOf%eOx$ma~OW%gOX%jO~O$s%lOl$qX~Ol'}O~Ox%pO~O!l%qO~Ol!TO!V!Ri$o!Ri~Ol!TO!V!Ti$o!Ti~O!Z!jO!V!Yi!]!Yi!^!Yi!_!Yi!`!Yi!a!Yi!b!Yi!c!Yi!d!Yi!e!Yi!f!Yi!g!Yi!h!Yi!k!Yi#U!Yi#X!Yi#_!Yi$[!Yi$_!Yi$o!Yif!Yix!YiX!Yi#V!Yi!l!Yi~O![!Yi~PHgO![!kO~PHgO!Z!jO![!kO!]!lO!V!Yi!_!Yi!`!Yi!a!Yi!b!Yi!c!Yi!d!Yi!e!Yi!f!Yi!g!Yi!h!Yi!k!Yi#U!Yi#X!Yi#_!Yi$[!Yi$_!Yi$o!Yif!Yix!YiX!Yi#V!Yi!l!Yi~O!^!Yi~PJiO!Z!jO![!kO!]!lO!^!mO!a!pO!b!qO!V!Yi!_!Yi!c!Yi!d!Yi!e!Yi!f!Yi!g!Yi!h!Yi!k!Yi#U!Yi#X!Yi#_!Yi$[!Yi$_!Yi$o!Yif!Yix!YiX!Yi#V!Yi!l!Yi~O!`!oO~PLdO!`!Yi~PLdO!Z!jO![!kO!]!lO!^!mO!V!Yi!_!Yi!`!Yi!a!Yi!c!Yi!d!Yi!e!Yi!f!Yi!g!Yi!h!Yi!k!Yi#U!Yi#X!Yi#_!Yi$[!Yi$_!Yi$o!Yif!Yix!YiX!Yi#V!Yi!l!Yi~O!b!qO~PNfO!^!mO~PJiO!Z!jO![!kO!]!lO!^!mO!_!nO!`!oO!a!pO!b!qO!g!vO!h!uO#X!xO!V!Yi!e!Yi!f!Yi!k!Yi#U!Yi#_!Yi$[!Yi$_!Yi$o!Yif!Yix!YiX!Yi#V!Yi!l!Yi~O!c!Yi!d!Yi~P!!hO!c!rO!d!rO~P!!hO#V%wO~P+bO!V!Yi!c!Yi!d!Yi!e!Yi!f!Yi!g!Yi!h!Yi!k!Yi#U!Yi#X!Yi$o!Yif!Yi!l!Yi~O!Z!jO![!kO!]!lO!^!mO!_!nO!`!oO!a!pO!b!qO#_!Yi$[!Yi$_!Yix!YiX!Yi#V!Yi~P!$tO!l$pa~P-UOf%|O!l$pa~O$[#OO~P`Of&TO!l$tX~O!l&VO~O$[#OO~O$[&YO~Of&ZOX$dX~OX&]O~OW#tOX$ha~Of&_OX$ha~Of$Pax$Pa~P+bOx$mi~P(zOl!TOXjXfjX!VjX$ojX~Of&cO!V&bO$o&bOX$rX~Of&cOX$rX~OX&eO~O!V!Yq!c!Yq!d!Yq!e!Yq!f!Yq!g!Yq!h!Yq!k!Yq#U!Yq#X!Yq$o!Yqf!Yq!l!Yq~O!Z!jO![!kO!]!lO!^!mO!_!nO!`!oO!a!pO!b!qO#_!Yq$[!Yq$_!Yqx!YqX!Yq#V!Yq~P!)lO!Z'fO!['gO!]'hO!^'iO!_'jO!`'kO!a'lO!b'mO!c'nO!d'nO!e'oO!f'oO!g(XO!h'pO!k!wO#U(jO#X!xOl!Qi!V!Qi$o!Qi~Of!oi!l!oi~P!+gOf!oi!l!oi~P+bO!l$pi~P-UO$Y&lO~OW&oO!l$ta~Of&pO!l$ta~OX$da~PAnOf&uOX$da~OW#tOX$hi~OW%gOX$ra~Of&{OX$ra~O#k(kO#m(YOf#gXx#gX!V#gX!Z#gX![#gX!]#gX!^#gX!_#gX!`#gX!a#gX!b#gX!c#gX!d#gX!e#gX!f#gX!g#gX!h#gX!k#gX#U#gX#X#gX$o#gXl#gXX#gX#_#gX$[#gX$_#gX#V#gX!l#gX~O!Z!jO![!kO!]!lO!^!mO!_!nO!`!oO!a!pO!b!qO!c!rO!d!rO!e!sO!f!sO!g!vO!h!uO#U!tO#X!xO~O!V#Ty!k#Ty#_#Ty$[#Ty$_#Ty$o#Tyf#Tyx#TyX#Ty#V#Ty!l#Ty~P!0rOW&oO!l$ti~OW'QO!S'XO$u'SO~PAnOX$di~PAnOW#tO~OX!uif!ui~P+bO!V&bO$o&bOX$Saf$Sa~OW%gOX$ri~O#k(kO#m(YOf#gax#ga!V#ga!Z#ga![#ga!]#ga!^#ga!_#ga!`#ga!a#ga!b#ga!c#ga!d#ga!e#ga!f#ga!g#ga!h#ga!k#ga#U#ga#X#ga$o#gal#gaX#ga#_#ga$[#ga$_#ga#V#ga!l#ga~O$Z'[O$_']O~P`OW&oO~OW'QO!S'XO$Z'[O$_#PO$u'SO~PAnOW'aO~OW%gO~O!V'eO$o'eOl!qX~P$kOf!Qi!l!Qi~P!+gO!Z'fOl!Yi![!Yi!]!Yi!^!Yi!_!Yi!`!Yi!a!Yi!b!Yi~P!$tO!Z'fO!['gOl!Yi!]!Yi!^!Yi!_!Yi!`!Yi!a!Yi!b!Yi~P!$tO!Z'fO!['gO!]'hOl!Yi!^!Yi!_!Yi!`!Yi!a!Yi!b!Yi~P!$tO!Z'fO!['gO!]'hO!^'iO!`'kO!a'lO!b'mOl!Yi!_!Yi~P!$tO!Z'fO!['gO!]'hO!^'iO!a'lO!b'mOl!Yi!_!Yi!`!Yi~P!$tO!Z'fO!['gO!]'hO!^'iO!b'mOl!Yi!_!Yi!`!Yi!a!Yi~P!$tO!Z'fO!['gO!]'hO!^'iOl!Yi!_!Yi!`!Yi!a!Yi!b!Yi~P!$tO!Z'fO!['gO!]'hO!^'iO!_'jO!`'kO!a'lO!b'mO!g(XO!h'pO#X!xOl!Yi!V!Yi!e!Yi!f!Yi!k!Yi#U!Yi$o!Yif!Yi!l!Yi~O!c!Yi!d!Yi~P!<YO!c'nO!d'nO~P!<YO!Z'fO!['gO!]'hO!^'iO!_'jO!`'kO!a'lO!b'mOl!Yi~P!$tOVSOWUOYbOhoOopOqqOsrOusOwyO!PZO!StO!UuO!XvO!gdO!naO!s(dO#QxO#ScO#[dO#b(eO#d{O#i(fO#o(nO#q!OO#y(gO$[#OO$jWO$kWO~PAnO!Z'fO!['gO!]'hO!^'iO!_'jO!`'kO!a'lO!b'mOl!Yq~P!)lOl'}O!V'eO~P:PO!Z'fO!['gO!]'hO!^'iO!_'jO!`'kO!a'lO!b'mO!c'nO!d'nO!e'oO!f'oO!g(XO!h'pO#U(jO#X!xO~Ol#Ty!V#Ty!k#Ty$o#Tyf#Ty!l#Ty~P!AfO!V'eO$o'eO~O!h'|O~Ol'}OqqO~O#V(SO~P+bOW(ZO~OW([O~OW(_O~OW(`O~O!h(cO~OVSO!S!fO!U!gO!s(iO#b(hO~OW(lO~O$f$e]!c!e!g^_$g#SW$ll#[!O$u!Z![!]#V#U~",
  goto: "Ch$uPPP$v%O%Z%dPPPP&}'QPPP(rPPPP(rP%ZP*^*l,bP,t%ZP,}P%ZP%ZP%ZPP-d.x0^1r3ZPP-d4oP4oPP-dP-dPPPPPPPPPPPPPP-d-dPP-dP6T-d-d-dP6^6e6m6p6s7u7y8W8Z8a7u-dP-dP-dPP-dP8g-dP8j8sP$v8{P8{P9T8{8{9ZP9eP9kP8{P8{P9s9w9{9{9{9{8{P:P:Z:a:g:m:t:z<i<o<v<|=S=^PPPPPPPPP=d=g=qPPP=t=wPPPA_AePB{CRCbPCe]kOm$x&m'O'}[gOm$x&m'O'}R$r#Q_fOm#Q$x&m'O'}^TOm#Q$x&m'O'}#m!`Z]abdvy|!P!W!a!c!d!j!k!l!m!n!o!p!q!r!s!t!u#W$O$h$l$m$n%V%e%w%|&a&b&k'c'd'e'f'g'h'i'j'k'l'm'n'o'p'|(S(c(f(g(j(k(mR#q!S#teOZabdmvy|!P!W!c!d!j!k!l!m!n!o!p!q!r!s!t!u#Q#W$O$h$l$m$n$x%V%e%w%|&a&b&k&m'O'c'd'e'f'g'h'i'j'k'l'm'n'o'p'|'}(S(c(f(g(j(kQ%[#pU&t&Z&u'YT'R&s'W$RROZabdmvy|!P!W!c!d!j!k!l!m!n!o!p!q!r!s!t!u#Q#W#p$O$h$l$m$n$x%V%e%w%|&Z&a&b&k&m&s&u'O'W'Y'c'd'e'f'g'h'i'j'k'l'm'n'o'p'|'}(S(c(f(g(j(kU!XU['bQ#ZoQ#cxR$z#^#t^OZabdmvy|!P!W!c!d!j!k!l!m!n!o!p!q!r!s!t!u#Q#W$O$h$l$m$n$x%V%e%w%|&a&b&k&m'O'c'd'e'f'g'h'i'j'k'l'm'n'o'p'|'}(S(c(f(g(j(kQ#u!VQ%h$RU&^%_&_&wV&y&c&{'ZW!UU#t%g'bQ${#_Q$|#`Q%r$WR%s$XQ#s!TQ$i!wR&f%m^fOm#Q$x&m'O'}Q%P#eQ%u$YQ(P([R(Q(_#ueOZabdmvy|!P!W!c!d!j!k!l!m!n!o!p!q!r!s!t!u#Q#W$O$h$l$m$n$x%V%e%w%|&a&b&k&m'O'c'd'e'f'g'h'i'j'k'l'm'n'o'p'|'}(S(c(f(g(j(k#u[OZabdmvy|!P!W!c!d!j!k!l!m!n!o!p!q!r!s!t!u#Q#W$O$h$l$m$n$x%V%e%w%|&a&b&k&m'O'c'd'e'f'g'h'i'j'k'l'm'n'o'p'|'}(S(c(f(g(j(k#uXOZabdmvy|!P!W!c!d!j!k!l!m!n!o!p!q!r!s!t!u#Q#W$O$h$l$m$n$x%V%e%w%|&a&b&k&m'O'c'd'e'f'g'h'i'j'k'l'm'n'o'p'|'}(S(c(f(g(j(k#tVOZabdmvy|!P!W!c!d!j!k!l!m!n!o!p!q!r!s!t!u#Q#W$O$h$l$m$n$x%V%e%w%|&a&b&k&m'O'c'd'e'f'g'h'i'j'k'l'm'n'o'p'|'}(S(c(f(g(j(kR#|!Z#uYOZabdmvy|!P!W!c!d!j!k!l!m!n!o!p!q!r!s!t!u#Q#W$O$h$l$m$n$x%V%e%w%|&a&b&k&m'O'c'd'e'f'g'h'i'j'k'l'm'n'o'p'|'}(S(c(f(g(j(k#u^OZabdmvy|!P!W!c!d!j!k!l!m!n!o!p!q!r!s!t!u#Q#W$O$h$l$m$n$x%V%e%w%|&a&b&k&m'O'c'd'e'f'g'h'i'j'k'l'm'n'o'p'|'}(S(c(f(g(j(kS!za!dV%{$n%|&kZ$S!b#b$Z(Z(`Q%i$RV&z&c&{'ZR%n$SR%m$SS$y#X(YS%O#e([S%U#i(]S%X#l(^Q%o$TW%t$Y%P(P(_S&O$w(bS&S$}(OS&h%u(QS&i%v(RS&r&W(UR'^'UT&R$x'}Q#SgQ$t#RS&P$x'}R&X%WR&n&PQ&m&PR&s&XQ']'OR'`'WR$k!xQ#SgQ$t#RR'`'W]hOm$x&m'O'}]jOm$x&m'O'}Q#g{R%T#hYiOm$x&m'OR&g'}X#Ti#U&g&}S#Vi&gT$v#U&}T'V&s'WT'U&s'WT'T&s'WQmOS#Ym'OR'O&mQ&[%[R&v&[Q%`#uR&`%`Q#z!YR%c#zS![XYR#}![Q$P!]R%f$PY]Om$x&m'O#h!aZabdvy|!P!W!c!d!j!k!l!m!n!o!p!q!r!s!t!u#Q#W$O$h$l$m$n%V%e%w%|&a&b&k'c'd'e'f'g'h'i'j'k'l'm'n'o'p'|(S(c(f(g(j(kU!e]!a(mR(m'}Q$o!zR%}$oS&d%h%iR&|&dQ#RgR$s#RQ&U%QR&q&UQ#UiS$u#U&}R&}&gQ'W&sR'_'WR!RPWlOm&m'OT&Q$x'}R%^#pR#w!V^_Om#Q$x&m'O'}S!]Z!cY!ya!d$n%|&kQ!|bS!}d'cS#av'dQ#dyQ#i|Q#l!PQ#x!WS$[!j'fQ$]!kQ$^!lQ$_!mQ$`!nQ$a!oQ$b!pQ$c!qQ$d!rQ$e!sQ$f!tQ$g!uQ$w#WU%d$O%e&aQ%x$hQ%y$lQ%z$mQ&W%VQ&j%wQ&x&bQ'q'eQ'r'gQ's'hQ't'iQ'u'jQ'v'kQ'w'lQ'x'mQ'y'nQ'z'oQ'{'pQ(T'|Q(U(cQ(V(SQ(](fQ(^(gQ(a(jR(b(kQ!_ZR$U!c!f`OZbdmvy!W!c!j!k!l!m!n!o!p!q!r!s!t!u#Q$O$h$m$x%e%w&a&b&m'O'}(j!_(Wa|!P!d#W$l$n%V%|&k'c'd'e'f'g'h'i'j'k'l'm'n'o'p'|(S(c(f(g(kQ!{aR$V!dQ$T!bQ$}#bQ%v$ZQ(O(ZR(R(`R%k$RR%S#f",
  nodeNames: "\u26A0 Comment Script SimpleStatement SmallStatement StandaloneAnnotationNode AnnotationNode @ Identifier ) ( CallParamsLiteralExpressionNode LiteralExpressionNode True False Null BuiltinConstants PI TAU INF NaN String , AssertNode assert CallParamsExpressionNode ParameterNode TypeCast : Type ClassNameStatement class_name ExtendsStatement extends SignalStatement signal PassStatement pass ReturnNode return ] ArrayExpressionNode SubscriptExpressionNode FirstVariableName VariableName GetNodeExpressionNode . [ AssignmentExpressionNode VariableNode var ConstantNode const Equal AwaitExpressionNode await BinaryOperatorExpressionNode ArithOp ArithOp ArithOp BitOp CompareOp BitOp BitOp BitOp AndOp LogicOp OrOp LogicOp NotOp in CallExpressionNode CastExpressionNode as } DictionaryExpressionNode { DictionaryEntry GroupedExpressionNode IdentifierExpressionNode LambdaExpressionNode func CallParamsParameterNode AssignmentExpressionNode FunctionReturnType FunctionReturnPointer Body SuiteNodeBody Newline SuiteNode Indent Dedent ExpressionNodeBody PreloadExpressionNode preload SelfExpressionNode SelfToken TernaryOperatorExpressionNode TernaryOp TernaryOp TypeTestExpressionNode is ClassName UnaryOperatorNode ArithOp Eof StatementGroup ; CompoundStatement ClassNode class EnumNode enum EnumBody FunctionNode IfNode IfClause if ElifClause elif ElseClause else ForNode for MatchNode match MatchBranchNode PatternNode VarPatternNode IdentifierPatternNode LiteralPatternNode WildcardPatternNode WhileNode while",
  maxTerm: 175,
  context: trackIndent,
  nodeProps: [
    ["group", -2, 3, 108, "Statement", -18, 12, 41, 42, 45, 48, 54, 56, 71, 72, 75, 78, 79, 80, 93, 95, 97, 100, 103, "ExpressionNode", -3, 26, 49, 51, "AssignableNode"],
    ["openedBy", 9, "(", 74, "{"],
    ["closedBy", 10, ")", 76, "}"]
  ],
  propSources: [gdscriptHighlighting],
  skippedNodes: [0, 1],
  repeatNodeCount: 13,
  tokenData: "Ae~R|XY#{pq#{qr$Wrs$est(Vtu(quv(vvw)Vwx)jxy-[yz-az{-f{|-y|}.T}!O.Y!O!P.l!P!Q/w!Q!R0R!R![0s![!]2e!]!^2l!^!_2q!_!`3U!`!a3^!a!b3z!b!c4S!c!}4X!}#O4j#P#Q4o#Q#R4t#R#S4|#T#U5a#U#Y4X#Y#Z6t#Z#b4X#b#c9U#c#d<S#d#g4X#g#h=O#h#i>z#i#o4X#o#p@v#p#q@{#q#rA`~$QQ$a~XY#{pq#{R$]P#[P!_!`$`Q$eO!_Q~$hXOY$eZ]$e^r$ers%Ts#O$e#O#P%u#P;'S$e;'S;=`(P<%lO$e~%YX$g~OY$eZ]$e^r$ers%Ts#O$e#O#P%u#P;'S$e;'S;=`(P<%lO$e~%xVO#i$e#i#j&_#j#l$e#l#m&z#m;'S$e;'S;=`(P<%lO$e~&bS!Q![&n!c!i&n#T#Z&n#o#p'd~&qR!Q![&z!c!i&z#T#Z&z~&}R!Q!['W!c!i'W#T#Z'W~'ZR!Q![$e!c!i$e#T#Z$e~'gR!Q!['p!c!i'p#T#Z'p~'sS!Q!['p!c!i'p#T#Z'p#q#r$e~(SP;=`<%l$e~([TP~OY(VZ](V^;'S(V;'S;=`(k<%lO(V~(nP;=`<%l(V~(vO$j~R(}P$kP![Q!_!`)QQ)VO$oQ~)[Q!b~vw)b!_!`)Q~)gP!d~!_!`)Q~)mXOY)jZ])j^w)jwx*Yx#O)j#O#P*z#P;'S)j;'S;=`-U<%lO)j~*_X$g~OY)jZ])j^w)jwx*Yx#O)j#O#P*z#P;'S)j;'S;=`-U<%lO)j~*}VO#i)j#i#j+d#j#l)j#l#m,P#m;'S)j;'S;=`-U<%lO)j~+gS!Q![+s!c!i+s#T#Z+s#o#p,i~+vR!Q![,P!c!i,P#T#Z,P~,SR!Q![,]!c!i,]#T#Z,]~,`R!Q![)j!c!i)j#T#Z)j~,lR!Q![,u!c!i,u#T#Z,u~,xS!Q![,u!c!i,u#T#Z,u#q#r)j~-XP;=`<%l)j~-aOY~~-fOX~~-kQ![Qz{-q!_!`)Q~-vP!Z~!_!`)QR.QP#[P!]Q!_!`)Q~.YOf~V.aQ#[P!]Q!_!`)Q!`!a.gS.lO$sS~.qP!O~!Q![.t~.yS$f~!Q![.t!g!h/V#R#S/q#X#Y/V~/YQ{|/`}!O/`~/cP!Q![/f~/kQ$f~!Q![/f#R#S/`~/tP!Q![.t~0OP$l~![Q!_!`)Q~0WX$e~!O!P/q!Q![0s!d!e1_!g!h/V!z!{1v#R#S1X#U#V1_#X#Y/V#l#m1v~0xT$e~!O!P/q!Q![0s!g!h/V#R#S1X#X#Y/V~1[P!Q![0s~1bQ!Q!R1h!R!S1h~1mR$e~!Q!R1h!R!S1h#R#S1_~1yR!Q![2S!c!i2S#T#Z2S~2XS$e~!Q![2S!c!i2S#R#S1v#T#Z2S~2lOl~#V~~2qO#_~~2vQ!_Q!^!_2|!_!`$`~3RP!^~!_!`)Q~3ZP!V~!_!`$`~3cQ!_Q!_!`$`!`!a3i~3nQ!^~!_!`)Q!`!a3tQ3wP!_!`)Q~4PP#U~!a!b3t~4XOV~~4^SW~!Q![4X!c!}4X#R#S4X#T#o4X~4oO!P~~4tOx~~4yP!a~!_!`)Q~5TSW~$u~!Q![4X!c!}4X#R#S4X#T#o4X~5fUW~!Q![4X!c!}4X#R#S4X#T#b4X#b#c5x#c#o4X~5}UW~!Q![4X!c!}4X#R#S4X#T#W4X#W#X6a#X#o4X~6hS!c~W~!Q![4X!c!}4X#R#S4X#T#o4X~6yTW~!Q![4X!c!}4X#R#S4X#T#U7Y#U#o4X~7_UW~!Q![4X!c!}4X#R#S4X#T#`4X#`#a7q#a#o4X~7vUW~!Q![4X!c!}4X#R#S4X#T#g4X#g#h8Y#h#o4X~8_UW~!Q![4X!c!}4X#R#S4X#T#X4X#X#Y8q#Y#o4X~8xS^~W~!Q![4X!c!}4X#R#S4X#T#o4X~9ZWW~!Q![4X!c!}4X#R#S4X#T#c4X#c#d9s#d#i4X#i#j:o#j#o4X~9xUW~!Q![4X!c!}4X#R#S4X#T#h4X#h#i:[#i#o4X~:cS!g~W~!Q![4X!c!}4X#R#S4X#T#o4X~:tUW~!Q![4X!c!}4X#R#S4X#T#`4X#`#a;W#a#o4X~;]UW~!Q![4X!c!}4X#R#S4X#T#`4X#`#a;o#a#o4X~;vS_~W~!Q![4X!c!}4X#R#S4X#T#o4X~<XUW~!Q![4X!c!}4X#R#S4X#T#f4X#f#g<k#g#o4X~<rS!e~W~!Q![4X!c!}4X#R#S4X#T#o4X~=TUW~!Q![4X!c!}4X#R#S4X#T#X4X#X#Y=g#Y#o4X~=lUW~!Q![4X!c!}4X#R#S4X#T#`4X#`#a>O#a#o4X~>TUW~!Q![4X!c!}4X#R#S4X#T#Y4X#Y#Z>g#Z#o4X~>nS#S~W~!Q![4X!c!}4X#R#S4X#T#o4X~?PUW~!Q![4X!c!}4X#R#S4X#T#f4X#f#g?c#g#o4X~?hUW~!Q![4X!c!}4X#R#S4X#T#i4X#i#j?z#j#o4X~@PUW~!Q![4X!c!}4X#R#S4X#T#X4X#X#Y@c#Y#o4X~@jS]~W~!Q![4X!c!}4X#R#S4X#T#o4X~@{O!n~~AQQ!`~!_!`)Q#p#qAW~A]P!f~!_!`)Q~AeO!l~",
  tokenizers: [indentation, newlines, 0, 1, 2],
  topRules: { "Script": [0, 2] },
  specialized: [{ term: 8, get: (value) => spec_Identifier[value] || -1 }],
  tokenPrec: 3757
});
export {
  parser
};
//# sourceMappingURL=index.mjs.map
