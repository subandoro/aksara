/*!
* trans.js
* https://bennylin.github.com/transliterasijawa
*
* Copyright 2013, Bennylin @bennylin
* Dual licensed under the MIT or GPL Version 2 licenses.
* Released under the MIT, BSD, and GPL Licenses.
*
* Versions:
* 7 Mei 2013 - v 1.0
* 25 Juli 2013 - v 1.1
* 8 May 2015 - v 1.2
* 1 Juni 2016 - v 1.3
* 2020 - v 1.4
* 2021
** v 1.5 more thorough Murda support (with cakra/pengkal/panjingan)
** v 1.51 zws (zero-width-space) after each layar/cecak/wignyan to produce line break 
          for a very long sentence without comma, disable the Javanese "parentheses"
*​ 2022
** v 1.52 non-aktifkan murda untuk "gh" dan "kh" dalam mode "Tidak pakai Murda"
**        (terima kasih untuk Mas Dodi Subandoro)
* 
* TOC
* I. Function SuperTrim, findstr
* II. Function isDigit, isPunct, isVowel
* III. Function isSpecial, isHR, isLW
* IV. Function GetMatra
* V. Function GetShift (the longest part of the code, almost half the total lines)
* VI. Function GetCoreSound, GetSpecialSound
* VII. Function ResolveCharacterSound
* VIII. Function GetSound
* IX. Function DoTransliterate
*
* Derived with permission from Hindi Transliteration by Markandey Singh @markandey
* http://www.purplegene.com/static/HindiTranslitration.html (deadlink as of 2021)
* http://web.archive.org/web/20190113114955/http://www.purplegene.com/static/HindiTranslitration.html
*/

var vowelPrev = false;
//var spacePrev = false;

/***************************
I. Function SuperTrim, findstr
trim string, menemukan karakter di dalam string
****************************/
function SuperTrim(str) {
    str = str || '';
    ret = str.replace(/^\s*|\s*$/g,'').replace(/\s+/g,' ');
    return ret;
}
function findstr(str,tofind){
    for (var i = 0; i < str.length; i++)
        if (str[i] == tofind)
            return true;
    return false;
}
/***************************
II. Function isDigit, isPunct, isVowel
cek apakah digit, tanda baca, atau huruf vokal (a/ă/å/ɔ, e/è/é, i, o, u, ě/ê/ə, ô, ā/ī/ū/ō)
****************************/
function isDigit( /*char*/ a) {
    var str = "0123456789";
    return findstr(str,a);
}
function isPunct( /*char*/ a) {
    var str = ",.><?/+=-_}{[]*&^%$#@!~`\"\\|:;()";
    return findstr(str,a);
}
function isVowel( /*char*/ a) {
    var str = "AaĂăEeÈèÉéIiOoUuÊêĚěĔĕṚṛXxôâāīūōåɔə";
   return findstr(str,a);
}
function isConsonant( /*char*/ a) {
    var str = "BCDfGHJKLMNPQRSTVWYZbcdfghjklmnpqrstvwyzḌḍṆṇṢṣṬṭŊŋÑñɲś";//Xx are vowels (pepet)
   return findstr(str,a);
}
/***************************
III. Function isSpecial, isHR, isLW
cek apakah karakter spesial (bikonsonan/cakra-pengkal/layar-cecak-wignyan/panjingan)
****************************/
function isSpecial( /*char*/ a) {
    var str = "GgHhRrYyñn"; //untuk bikonsonan th, dh, ng (nga dan cecak), ny, -r- (cakra), -y- (pengkal), jñ/jnya (ꦘ)
    return findstr(str,a);
}

function isHR( /*char*/ a) {
    var str = "HhRrŊŋ";//untuk layar dan wignyan dan cecak ([[:en:w:Engma]])
    return findstr(str,a);
}

function isLW( /*char*/ a) {
    var str = "LlWw";//untuk panjingan ("ng" dapat diikuti "g", "r"/cakra, "y"/pengkal, dan "w" atau "l"/panjingan)
    return findstr(str,a);
}

function isCJ( /*char*/ a) {
    var str = "CcJj";//untuk anuswara -nj- dan -nc-
    return findstr(str,a);
}
/***************************
IV. Function GetMatra
apabila huruf vokal, return matra (sandhangan swara)
****************************/
function GetMatra(str) {
    var i = 0;
    if (str.length < 1) {
        return "꧀";
    }
    while (str[i] == 'h') {
        i++;
        if (i >= str.length) {
            break;
        }
    }
    if (i < str.length) {
        str = str.substring(i);
    }
    var matramap1 = { "e":'ꦺ', "E":'ꦌ' } //mode ketik
    var matramap2 = { "e":'ꦼ', "E":'ꦄꦼ' } //mode kopas
    var matramap3 = { //both mode ketik and kopas
     "ā":"ꦴ", "â":"ꦴ", "aa":'ꦴ',
     "è":'ꦺ', "é":'ꦺ',
     "i":'ꦶ', "ī":"ꦷ", "ii":'ꦷ',
     "o":'ꦺꦴ', "ō":"ꦼꦴ",
     "u":'ꦸ', "ū":"ꦹ", "uu":'ꦹ',
     "x":"ꦼ", "ě":"ꦼ", "ĕ":"ꦼ", "ê":"ꦼ", "ə":"ꦼ",
     "ô":"", "ă":"", "å":"", "ɔ":"",
     "A":'ꦄ', "Ă":'ꦄ',
     "È":'ꦌ', "É":'ꦌ',
     "I":'ꦆ', "O":'ꦎ',  "U":'ꦈ',
     "X":"ꦄꦼ", "Ě":"ꦄꦼ", "Ĕ":"ꦄꦼ", "Ê":"ꦄꦼ",
     "ṛ":"ꦽ", "Ṛ":"ꦽ",
     "ai":'ꦻ', "au":'ꦻꦴ'
    }
    var matramap, mode;
    var modeTranslit = document.getElementsByName("mode");
    for(var rad in modeTranslit) {
      if(modeTranslit[rad].checked)
        mode = modeTranslit[rad].value;
    }
    if(mode == "kopas")
      matramap = {...matramap2, ...matramap3};
    else //if(mode == "ketik")
      matramap = {...matramap1, ...matramap3};

    if(matramap[str]!==undefined){
        return matramap[str];
    }
    return "";
}
/***************************
V. Function GetShift (the longest part of the code, almost half the total lines)

Basically all the exceptions to the Consonant-Vocal (CV) cluster. It means all the double Consonant-Consonant-Vocal (CCV) cluster,
or triple CCCV cluster.

Quick TOC:
V.1. 2nd letter is 'h' -- th, dh, murda (kh, gh, ch, jh, Th, Dh, ṭh, ḍh, ph, bh, sh), hh, rh, h
                          TODO: maybe add qh for ka sasak, zh for sa mahaprana, and rh for ra agung, considering jh
V.2. 2nd letter is 'g' -- ng (ngg, ngng), hg, gg, rg, g
V.3. 2nd letter is 'y' -- ny, hy, ry, yy, qy, murda (Ky, Gy, Cy, Jy, Ty, Dy, Ṭy, Ḍy, Py, By, Sy, Qy, Ry, Zy), y
V.4. 2nd letter is 'r' -- hr, rr, qr, murda (Kr, Gr, Cr, Jr, Nr, Tr, Dr, Ṭr, Ḍr, Pr, Br, Sr, Qr, Rr, Zr), r
V.5. 2nd letter is  panjingan 'l'/'w' -- ll, rl, hl; rw, hw, ww, ngw
V.6. 2nd letter is 'c', and 'j' -- nc: ncr, ncl; rc; nj: njr, njl; rj;
V.7. 2nd letter is 'ñ' or 'n' -- jñ, jny
apabila huruf bikonsonan, return karakter khusus

To add a new second letter exception, add in function isSpecial

Longest consonant cluster is 4 (nggr, nggl, nggw, nggy). Doesn't compute cluster longer than that
(e.g. sxlangnggronjal, 6 consonants). Need to separate them by a space
****************************/
function GetShift(str1) {
    str = str1.toLowerCase(); //case insensitive

    var modeMurda = document.getElementsByName("murda");
    for(var rad in modeMurda) {
      if(modeMurda[rad].checked)
        murda = modeMurda[rad].value;
    }
    if(murda == "pakai")
      str2 = str1; //case sensitive (particularly the 8 characters of ꦛ ꦜ ꦝ ꦞ ꦠ ꦡ ꦢ ꦣ),
                   //for combination of murda and cakra/pengkal/panjingan
    else //if(murda == "tidak")
      str2 = str1.toLowerCase(); //case insensitive
    //V.1. 2nd letter of the consonant cluster is 'h'
    if (str2.indexOf("th") == 0) { //suku kata diawali 'th'
      if (str2.indexOf("thl") == 0) { //thl-
        return { "CoreSound": "ꦛ꧀ꦭ", "len": 3 };
      } else if (str2.indexOf("thr") == 0) { //thr-
        return { "CoreSound": "ꦛꦿ", "len": 3 };
      } else if (str2.indexOf("thw") == 0) { //thw-
        return { "CoreSound": "ꦛ꧀ꦮ", "len": 3  };
      } else if (str2.indexOf("thy") == 0) { //thy-
        return { "CoreSound": "ꦛꦾ", "len": 3  };
      } else {
        return { "CoreSound": "ꦛ", "len": 2 };//tha
      }
    } else if (str2.indexOf("dh") == 0) { //suku kata diawali 'dh'
      if (str2.indexOf("dhl") == 0) { //dhl-
        return { "CoreSound": "ꦝ꧀ꦭ", "len": 3 };
      } else if (str2.indexOf("dhr") == 0) { //dhr-
        return { "CoreSound": "ꦝꦿ", "len": 3 };
      } else if (str2.indexOf("dhw") == 0) { //dhw-: dhwani
        return { "CoreSound": "ꦝ꧀ꦮ", "len": 3  };
      } else if (str2.indexOf("dhy") == 0) { //dhy-: dhyaksa
        return { "CoreSound": "ꦝꦾ", "len": 3  };
      } else {
        return { "CoreSound": "ꦝ", "len": 2 };//dha
      }
    } else if (str2.indexOf("Th") == 0) { //suku kata diawali 'Th'
      if (str2.indexOf("Thl") == 0) { //Thl-
        return { "CoreSound": "ꦜ꧀ꦭ", "len": 3 };
      } else if (str2.indexOf("Thr") == 0) { //Thr-
        return { "CoreSound": "ꦜꦿ", "len": 3 };
      } else if (str2.indexOf("Thw") == 0) { //Thw-
        return { "CoreSound": "ꦜ꧀ꦮ", "len": 3  };
      } else if (str2.indexOf("Thy") == 0) { //Thy-
        return { "CoreSound": "ꦜꦾ", "len": 3  };
      } else {
        return { "CoreSound": "ꦜ", "len": 2 };//Tha Mahaprana
      }
    } else if (str2.indexOf("Dh") == 0) { //suku kata diawali 'Dh'
      if (str2.indexOf("Dhl") == 0) { //Dhl-
        return { "CoreSound": "ꦞ꧀ꦭ", "len": 3 };
      } else if (str2.indexOf("Dhr") == 0) { //Dhr-
        return { "CoreSound": "ꦞꦿ", "len": 3 };
      } else if (str2.indexOf("Dhw") == 0) { //Dhw-: Dhwani
        return { "CoreSound": "ꦞ꧀ꦮ", "len": 3  };
      } else if (str2.indexOf("Dhy") == 0) { //Dhy-: Dhyaksa
        return { "CoreSound": "ꦞꦾ", "len": 3  };
      } else {
        return { "CoreSound": "ꦞ", "len": 2 };//Dha Mahaprana
      }
/* murda block start */
    } else if (str.indexOf("ṭh") == 0) { //ṭh (aksara murda: tha mahaprana)
  		if (str.indexOf("ṭhy") == 0) {
  			return { "CoreSound": "ꦜꦾ", "len": 2  };
	    } else if (str.indexOf("ṭhr") == 0) {
	    	return { "CoreSound": "ꦜꦿ", "len": 2  };
  		} else
      	return { "CoreSound":  "ꦜ", "len": 2  };
    } else if (str.indexOf("ḍh") == 0) { //ḍh (aksara murda: dha mahaprana)
  		if (str.indexOf("ḍhy") == 0) {
  			return { "CoreSound": "ꦞꦾ", "len": 2  };
	    } else if (str.indexOf("ḍhr") == 0) {
	    	return { "CoreSound": "ꦞꦿ", "len": 2  };
  		} else
        return { "CoreSound":  "ꦞ", "len": 2  };
// perubahan versi 1.52, dari ꦑ menjadi ꦏ꦳
    } else if (str.indexOf("kh") == 0) { //kh (aksara rekan)
      if (str.indexOf("khl") == 0) { //ka rekan + panjingan la
        return { "CoreSound": "ꦏ꦳꧀ꦭ", "len": 3 };
      } else if (str.indexOf("khr") == 0) { //ka rekan + cakra
        return { "CoreSound": "ꦏ꦳ꦿ", "len": 3 };
      } else if (str.indexOf("khw") == 0) { //ka rekan + panjingan wa
        return { "CoreSound": "ꦏ꦳꧀ꦮ", "len": 3  };
      } else if (str.indexOf("khy") == 0) { //ka rekan + wignyan
        return { "CoreSound": "ꦏ꦳ꦾ", "len": 3  };
      } else {
        return { "CoreSound":  "ꦏ꦳", "len": 2  };
      }
// perubahan versi 1.52, dari ꦓ menjadi ꦒ꦳
    } else if (str.indexOf("gh") == 0) { //gh (aksara rekan)
      if (str.indexOf("ghl") == 0) { //ga rekan + panjingan la
        return { "CoreSound": "ꦒ꦳꧀ꦭ", "len": 3 };
      } else if (str.indexOf("ghw") == 0) { //ga rekan + panjingan wa
        return { "CoreSound": "ꦒ꦳꧀ꦮ", "len": 3  };
      } else if (str.indexOf("ghr") == 0) { //ga rekan + cakra
        return { "CoreSound": "ꦒ꦳ꦿ", "len": 3 };
      } else if (str.indexOf("ghy") == 0) { //ga rekan + wignyan
        return { "CoreSound": "ꦒ꦳ꦾ", "len": 3  };
      } else {
        return { "CoreSound":  "ꦒ꦳", "len": 2  };
      }
    } else if (str.indexOf("Kh") == 0) { //Kh (aksara murda: ka murda)
      if (str.indexOf("Khl") == 0) { //ka murda + panjingan la
        return { "CoreSound": "ꦑ꧀ꦭ", "len": 3 };
      } else if (str.indexOf("Khr") == 0) { //ka murda + cakra
        return { "CoreSound": "ꦑꦿ", "len": 3 };
      } else if (str.indexOf("Khw") == 0) { //ka murda + panjingan wa
        return { "CoreSound": "ꦑ꧀ꦮ", "len": 3  };
      } else if (str.indexOf("Khy") == 0) { //ka murda + wignyan
        return { "CoreSound": "ꦑꦾ", "len": 3  };
      } else {
        return { "CoreSound":  "ꦑ", "len": 2  };
      }
    } else if (str.indexOf("Gh") == 0) { //Gh (aksara murda: ga murda)
      if (str.indexOf("Ghl") == 0) { //ga murda + panjingan la
        return { "CoreSound": "ꦓ꧀ꦭ", "len": 3 };
      } else if (str.indexOf("Ghw") == 0) { //ga murda + panjingan wa
        return { "CoreSound": "ꦓ꧀ꦮ", "len": 3  };
      } else if (str.indexOf("Ghr") == 0) { //ga murda + cakra
        return { "CoreSound": "ꦓꦿ", "len": 3 };
      } else if (str.indexOf("Ghy") == 0) { //ga murda + wignyan
        return { "CoreSound": "ꦓꦾ", "len": 3  };
      } else {
        return { "CoreSound":  "ꦓ", "len": 2  };
      }
    } else if (str.indexOf("ch") == 0) { //ch (aksara murda: ca murda)
      if (str.indexOf("chl") == 0) { //ca murda + panjingan la
        return { "CoreSound": "ꦖ꧀ꦭ", "len": 3 };
      } else if (str.indexOf("chr") == 0) { //ca murda + cakra
        return { "CoreSound": "ꦖꦿ", "len": 3 };
      } else if (str.indexOf("chw") == 0) { //ca murda + panjingan wa
        return { "CoreSound": "ꦖ꧀ꦮ", "len": 3  };
      } else if (str.indexOf("chy") == 0) { //ca murda + wignyan
        return { "CoreSound": "ꦖꦾ", "len": 3  };
      } else {
        return { "CoreSound":  "ꦖ", "len": 2  };
      }
    } else if (str.indexOf("jh") == 0) { //jh (aksara murda: ja mahaprana)
      if (str.indexOf("jhl") == 0) { //ja mahaprana + panjingan la
        return { "CoreSound": "ꦙ꧀​ꦭ", "len": 3 }; //with zws, otherwise the panjingan is overlapped
      } else if (str.indexOf("jhr") == 0) { //ja mahaprana + cakra
        return { "CoreSound": "ꦙꦿ", "len": 3 };
      } else if (str.indexOf("jhw") == 0) { //ja mahaprana + panjingan wa
        return { "CoreSound": "ꦙ꧀ꦮ", "len": 3  };
      } else if (str.indexOf("jhy") == 0) { //ja mahaprana + wignyan
        return { "CoreSound": "ꦙꦾ", "len": 3  };
      } else {
        return { "CoreSound":  "ꦙ", "len": 2  };
      }
    } else if (str.indexOf("ph") == 0) { //ph (aksara murda: pa murda)
      if (str.indexOf("phl") == 0) { //pa murda + panjingan la
        return { "CoreSound": "ꦦ꧀ꦭ", "len": 3 };
      } else if (str.indexOf("phr") == 0) { //pa murda + cakra
        return { "CoreSound": "ꦦꦿ", "len": 3 };
      } else if (str.indexOf("phw") == 0) { //pa murda + panjingan wa
        return { "CoreSound": "ꦦ꧀ꦮ", "len": 3  };
      } else if (str.indexOf("phy") == 0) { //pa murda + wignyan
        return { "CoreSound": "ꦦꦾ", "len": 3  };
      } else {
        return { "CoreSound":  "ꦦ", "len": 2  };
      }
    } else if (str.indexOf("bh") == 0) { //bh (aksara murda: ba murda)
      if (str.indexOf("bhl") == 0) { //ba murda + panjingan la
        return { "CoreSound": "ꦨ꧀ꦭ", "len": 3 };
      } else if (str.indexOf("bhr") == 0) { //ba murda + cakra
        return { "CoreSound": "ꦨꦿ", "len": 3 };
      } else if (str.indexOf("bhw") == 0) { //ba murda + panjingan wa
        return { "CoreSound": "ꦨ꧀ꦮ", "len": 3  };
      } else if (str.indexOf("bhy") == 0) { //ba murda + wignyan
        return { "CoreSound": "ꦨꦾ", "len": 3  };
      } else {
        return { "CoreSound":  "ꦨ", "len": 2  };
      }
    } else if (str.indexOf("sh") == 0) { //sh (aksara murda: sa murda)
      if (str.indexOf("shl") == 0) { //sa murda + panjingan la
        return { "CoreSound": "ꦯ꧀ꦭ", "len": 3 };
      } else if (str.indexOf("shr") == 0) { //sa murda + cakra
        return { "CoreSound": "ꦯꦿ", "len": 3 };
      } else if (str.indexOf("shw") == 0) { //sa murda + panjingan wa
        return { "CoreSound": "ꦯ꧀ꦮ", "len": 3  };
      } else if (str.indexOf("shy") == 0) { //sa murda + wignyan
        return { "CoreSound": "ꦯꦾ", "len": 3  };
      } else {
        return { "CoreSound":  "ꦯ", "len": 2  };
      }
/* murda block end */
//Uncatched exception: -h followed by hy, hr, hl, hw
    } else if (str.indexOf("hh") == 0) { //wignyan + ha, e.g. root word ends with 'h' with suffix -i
      return { "CoreSound": "ꦃꦲ", "len": 2  };
//Uncatched exception: -r followed by hy, hr, hl, hw
    } else if (str.indexOf("rh") == 0) { //layar + ha
      return { "CoreSound": "ꦂꦲ", "len": 2  };
    } else if (str.indexOf("h") == 1) { //h (h di posisi karakter kedua)
      return { "CoreSound": "" + GetCoreSound(str2[0]).CoreSound + "꧀ꦲ", "len": 2 };
    }

    //V.2. 2nd letter is 'g'
    if (str.indexOf("ng") == 0) { //suku kata diawali 'ng'
//Uncatched exception: -ng followed by ry, rw, rl
      if (str.indexOf("ngr") == 0) { //cakra (for cecak + ra, separate by a space)
        return { "CoreSound": "" + "ꦔꦿ", "len": 3 };
      } else if (str.indexOf("ngy") == 0) { //pengkal (for cecak + ya, separate by a space)
        return { "CoreSound": "" + "ꦔꦾ", "len": 3 };
//Uncatched exception: -ng followed by hy, hr, hl
      } else if (str.indexOf("nghw") == 0) { //tyonghwa
        return { "CoreSound": "" + "ꦁꦲ꧀ꦮ​", "len": 4 };
      } else if (str.indexOf("ngg") == 0) { //cecak + ga
	      if (str.indexOf("nggr") == 0) { //nggronjal
	        return { "CoreSound": "ꦔ꧀ꦒꦿ", "len": 4 };
	      } else if (str.indexOf("nggl") == 0) { //nggl-
	        return { "CoreSound": "ꦔ꧀ꦒ꧀ꦭ", "len": 4 };
	      } else if (str.indexOf("nggw") == 0) { //nggw-, munggwing
	        return { "CoreSound": "ꦔ꧀ꦒ꧀ꦮ", "len": 4 };
	      } else if (str.indexOf("nggy") == 0) { //nggy-, anggyat
	        return { "CoreSound": "ꦔ꧀ꦒꦾ", "len": 4 };
	      } else {
	        return { "CoreSound": "ꦔ꧀ꦒ", "len": 3 };
	      }
      } else if (str.indexOf("ngn") == 0) { //cecak + na
//Uncatched exception: -ng followed by ngy, ngr, ngl, ngw
	      if (str.indexOf("ngng") == 0) { //ngng
	      	return { "CoreSound": "ꦁ​ꦔ", "len": 4 };
	      } else {
	      	return { "CoreSound": "ꦁ​ꦤ", "len": 3 };
	      }
      } else if (str.indexOf("ngh") == 0) { //cecak + ha
	      	return { "CoreSound": "ꦁ​ꦲ", "len": 3 };
      } else if (str.indexOf("ngc") == 0) { //cecak + ca
	      	return { "CoreSound": "ꦁ​ꦕ", "len": 3 };
      } else if (str.indexOf("ngj") == 0) { //cecak + ja
	      	return { "CoreSound": "ꦁ​ꦗ", "len": 3 };
      } else if (str.indexOf("ngl") == 0) { //ngl, e.g. ngluwari
        return { "CoreSound": "ꦔ꧀ꦭ", "len": 3 };
      } else if (str.indexOf("ngw") == 0) { //ngw, e.g. ngwiru
        return { "CoreSound": "ꦔ꧀ꦮ", "len": 3 };
      } else {
        return { "CoreSound": "ꦁ​", "len": 2 };// cecak, with zws
      }
    } else if (str.indexOf("gg") == 0) { //'gg', e.g. root word ends with 'g' with suffix -i
      return { "CoreSound": "ꦒ꧀ꦒ", "len": 2 };
    } else if (str.indexOf("hg") == 0) { //wignyan + ga, e.g. dahgene
      return { "CoreSound": "ꦃꦒ", "len": 2 };
    } else if (str.indexOf("rg") == 0) { //layar + ga, e.g. amarga
      return { "CoreSound": "ꦂꦒ", "len": 2 };
    } else if (str.indexOf("g") == 1) { //g (g di posisi karakter kedua)
      return { "CoreSound": "" + GetCoreSound(str2[0]).CoreSound + "꧀ꦒ", "len": 2 };
    }

    //V.3. 2nd letter is 'y'
    if (str.indexOf("ny") == 0) { //suku kata diawali 'ny'
      if (str.indexOf("nyr") == 0) { //cakra
        return { "CoreSound": "ꦚꦿ", "len": 3 };/*
      } else if (str.indexOf("nyy") == 0) { //nyy, I don't think it's possible
        return { "CoreSound": "ꦚꦾ", "len": 3 };*/
      } else if (str.indexOf("nyl") == 0) { //nyl, e.g. nylonong
        return { "CoreSound": "ꦚ꧀ꦭ", "len": 3 };
      } else if (str.indexOf("nyw") == 0) { //nyw
        return { "CoreSound": "ꦚ꧀ꦮ", "len": 3 };/*
  		} else if (str2.indexOf("Ny") == 0) { //Na murda + pengkal, unlikely combination?
  			return { "CoreSound": "ꦟꦾ", "len": 2  };*/
      } else {
        return { "CoreSound": "ꦚ", "len": 2 };
      }
    } else if (str.indexOf("hy") == 0) { //wignyan + ya / ha + pengkal -- hyang
      return { "CoreSound": "ꦲꦾ", "len": 2 };
    } else if (str2.indexOf("ry") == 0) { //layar + ya, e.g. Suryati, Wiryadi
      if (str.indexOf("ryy") == 0) {
      return { "CoreSound": "ꦂꦪꦾ", "len": 3 } //'ryy', e.g. Duryyodhana (Jawa Kuno)
      } else {
      return { "CoreSound": "ꦂꦪ", "len": 2 };
      }/*
    } else if (str.indexOf("yy") == 0) { //'yy', I don't think it's possible
        return { "CoreSound": "ꦪꦾ", "len": 2 };*/
    } else if (str2.indexOf("qy") == 0) { //qy -- only pengkal
      return { "CoreSound": "ꦾ", "len": 1  };
    } else if (str.indexOf("y") == 1) { //pengkal (y di posisi karakter kedua)
      return { "CoreSound": "" + GetCoreSound(str2[0]).CoreSound + "ꦾ", "len": 2 };
    }

    //V.4. 2nd letter is 'r'
//Uncatched exception: -h followed by ry, rw, rl
    if (str.indexOf("hr") == 0) { //wignyan + ra / ha + cakra
      return { "CoreSound": "ꦲꦿ", "len": 2 };
    } else if (str.indexOf("wr") == 0) { //wr -- panjingan + cakra
      return { "CoreSound": "" + "ꦮꦿ", "len": 2  };
//Uncatched exception: -r followed by ry, rw, rl
    } else if (str.indexOf("rr") == 0) { //layar + ra (no cakra)
      return { "CoreSound": "ꦂꦫ", "len": 2  };
    } else if (str2.indexOf("qr") == 0) { //qr -- only pasangan ra
      return { "CoreSound": "꧀ꦫ", "len": 1  };
    } else if (str2.indexOf("qR") == 0) { //qR -- only cakra
      return { "CoreSound": "ꦿ", "len": 1  };
    } else if (str.indexOf("r") == 1) { //cakra (r di posisi karakter kedua)
      return { "CoreSound": "" + GetCoreSound(str2[0]).CoreSound + "ꦿ", "len": 2 };
    }

    //V.5. 2nd letter is 'l' or 'w'
    //panjingan -l
    if (str.indexOf("hl") == 0) { //wignyan + la
      return { "CoreSound": "ꦃꦭ", "len": 2  };
    } else if (str.indexOf("rl") == 0) { //layar + la
      return { "CoreSound": "ꦂꦭ", "len": 2  };
    } else if (str.indexOf("ll") == 0) { //ll
      return { "CoreSound": "ꦭ꧀ꦭ", "len": 2  };
    } else if (str.indexOf("ql") == 0) { //only panjingan
      return { "CoreSound": "꧀ꦭ", "len": 2 };
    } else if (str.indexOf("l") == 1) { // (l di posisi karakter kedua)
      return { "CoreSound": "" + GetCoreSound(str2[0]).CoreSound + "꧀ꦭ", "len": 2 };
    }

    //panjingan -w
    if (str.indexOf("hw") == 0) { //wignyan + ha
      return { "CoreSound": "ꦃꦮ", "len": 2  }; //ꦲ꧀ꦮ
    } else if (str.indexOf("rw") == 0) { //layar + ha
      return { "CoreSound": "ꦂꦮ", "len": 2  };//error untuk 'rwi', 'rwab'
    } else if (str.indexOf("ww") == 0) { //ww (wwang, pûrwwa) - terima kasih Mas Revo
      return { "CoreSound": "ꦮ꧀ꦮ", "len": 2  };
    } else if (str.indexOf("qw") == 0) { //only panjingan
      return { "CoreSound": "꧀ꦮ", "len": 2 };
    } else if (str.indexOf("w") == 1) { // (w di posisi karakter kedua)
      return { "CoreSound": "" + GetCoreSound(str2[0]).CoreSound + "꧀ꦮ", "len": 2 };
    }

    //V.6. 2nd letter is 'c' or 'j'
    if (str.indexOf("nc") == 0) { //nc
      if (str.indexOf("ncr") == 0) { //ncr -- kencrung
        return { "CoreSound": "ꦚ꧀ꦕꦿ", "len": 3  };
      } else if (str.indexOf("ncl") == 0) { //ncl -- kinclong
        return { "CoreSound": "ꦚ꧀ꦕ꧀ꦭ", "len": 3  };
      } else {
        return { "CoreSound": "ꦚ꧀ꦕ", "len": 2  };
      }
    } else if (str.indexOf("hc") == 0) { //wignyan + ca
      return { "CoreSound": "ꦃꦕ", "len": 2 };
    } else if (str.indexOf("rc") == 0) { //layar + ca -- arca
      return { "CoreSound": "ꦂꦕ", "len": 2  };
    } else if (str.indexOf("cc") == 0) { //cc -- impossible combination in real text
      return { "CoreSound": "ꦕ꧀ꦕ", "len": 2  };
    } else if (str2.indexOf("qc") == 0) { //only pasangan ca
      return { "CoreSound": "꧀ꦕ", "len": 2 };
    } else if (str.indexOf("c") == 1) { //c
      return { "CoreSound": "" + GetCoreSound(str2[0]).CoreSound + "꧀ꦕ", "len": 2 };
    }

    if (str.indexOf("nj") == 0) { //nj
      if (str.indexOf("njr") == 0) { //njr -- anjrit
        return { "CoreSound": "ꦚ꧀ꦗꦿ", "len": 3  };
      } else if (str.indexOf("njl") == 0) { //njl -- anjlog
        return { "CoreSound": "ꦚ꧀ꦗ꧀ꦭ", "len": 3  };
      } else {
        return { "CoreSound": "ꦚ꧀ꦗ", "len": 2  };
      }
    } else if (str.indexOf("hj") == 0) { //wignyan + ja
      return { "CoreSound": "ꦃꦗ", "len": 2 };
    } else if (str.indexOf("rj") == 0) { //layar + ja
      return { "CoreSound": "ꦂꦗ", "len": 2 };
    } else if (str.indexOf("jj") == 0) { //jj -- impossible combination in real text
      return { "CoreSound": "ꦗ꧀ꦗ", "len": 2  };
    } else if (str2.indexOf("qj") == 0) { //only pasangan ja
      return { "CoreSound": "꧀ꦗ", "len": 2 };
    } else if (str.indexOf("j") == 1) { //j
      return { "CoreSound": "" + GetCoreSound(str2[0]).CoreSound + "꧀ꦗ", "len": 2 };
    }

    //V.7. 2nd letter is 'ñ' or 'n'
    if (str.indexOf("jñ") == 0) { //suku kata diawali 'jñ'
      if (str.indexOf("jñl") == 0) { //suku kata diawali 'jñ' - nya murda
        return { "CoreSound": "ꦘ꧀ꦭ", "len": 3 };
      } else if (str.indexOf("jñr") == 0) { //nya murda + cakra
        return { "CoreSound": "ꦘꦿ", "len": 3 };
      } else if (str.indexOf("jñw") == 0) { //nya murda + panjingan wa
        return { "CoreSound": "ꦘ꧀ꦮ", "len": 3  };
      } else if (str.indexOf("jñy") == 0) { //nya murda + wignyan
        return { "CoreSound": "ꦘꦾ", "len": 3  };
      } else {
        return { "CoreSound": "ꦘ", "len": 2 };
      }
    } else if (str.indexOf("jn") == 0) { //suku kata diawali 'jn'
    	if (str.indexOf("jny") == 0) { //suku kata diawali 'jny' - nya murda
	      if (str.indexOf("jnyl") == 0) { //suku kata diawali 'jny' - nya murda
	        return { "CoreSound": "ꦘ꧀ꦭ", "len": 4 };
	      } else if (str.indexOf("jnyr") == 0) { //nya murda + cakra
	        return { "CoreSound": "ꦘꦿ", "len": 4 };
	      } else if (str.indexOf("jnyw") == 0) { //nya murda + panjingan wa
	        return { "CoreSound": "ꦘ꧀ꦮ", "len": 4  };
	      } else if (str.indexOf("jnyy") == 0) { //nya murda + wignyan
	        return { "CoreSound": "ꦘꦾ", "len": 4  };
	      } else {
        	return { "CoreSound": "ꦘ", "len": 3 };
        }
      } else {
        return { "CoreSound": "ꦗ꧀ꦤ", "len": 2 };
      }
//Uncatched exception: -h followed by ngy, ngr, ngl, ngw
    } else if (str.indexOf("hn") == 0) { //wignyan + na
      return { "CoreSound": "ꦃꦤ", "len": 2 };
//Uncatched exception: -r followed by ngy, ngr, ngl, ngw
    } else if (str.indexOf("rn") == 0) { //layar + na
      return { "CoreSound": "ꦂꦤ", "len": 2 };
    } else if (str.indexOf("nn") == 0) { //nn, e.g. root word ends with 'n' with suffix -i
      if (str.indexOf("nng") == 0) { //
        return { "CoreSound": "ꦤ꧀ꦁ​", "len": 3 };
      } else if (str.indexOf("nng") == 0) { //
        return { "CoreSound": "ꦤ꧀ꦚ꧀", "len": 3 };
      } else {
        return { "CoreSound": "ꦤ꧀ꦤ", "len": 2  };
      }
    } else if (str2.indexOf("qn") == 0) { //only pasangan na
      return { "CoreSound": "꧀ꦤ", "len": 2 };
    } else if (str.indexOf("ñ") == 1) { //huruf asing sih sebenarnya, kemungkinan kecil muncul
      return { "CoreSound": "" + GetCoreSound(str2[0]).CoreSound + "꧀ꦚ", "len": 2 };
    } else if (str.indexOf("n") == 1) { //
      return { "CoreSound": "" + GetCoreSound(str2[0]).CoreSound + "꧀ꦤ", "len": 2 };
    }

    //suku kata memiliki konsonan tersebut yang tidak di posisi kedua
    if (str.indexOf("h") > 1 || str.indexOf("g") > 1 || str.indexOf("y") > 1 ||
    str.indexOf("r") > 1 || str.indexOf("l") > 1 || str.indexOf("w") > 1 ||
    str.indexOf("c") > 1 || str.indexOf("j") > 1 || str.indexOf("n") > 1 || str.indexOf("ñ") > 1) {
        var sound = "";
        var len = 0;
        var index = 0;
        for (index = 0; index < str.length; index++) {
            var c = str[index];
            if (!isVowel(c)) {
                sound += ResolveCharacterSound(c);
                len++;
            }
            else {
                break;
            }
        }
        return { "CoreSound": sound, "len": len };
    }

    return { "CoreSound": null, "len": 1 };
}
/***************************
VI. Function GetCoreSound, GetSpecialSound
return aksara nglegana maupun aksara istimewa (f/v/z/pangkon)
****************************/
function GetCoreSound(str) {
    var soundMap1 = { //26 uppercase for non-Murda, largely mirror lowercase, except AEIOU, and HR
        "A":"ꦄ", //A
        "B":"ꦧ", //ba
        "C":"ꦕ", //ca
        "D":"ꦢ", //da
        "E":"ꦌ", //E
        "F":"ꦥ꦳", //fa rekan
        "G":"ꦒ", //ga
        "H":"ꦲ", //ha
        "I":"ꦆ", //I
        "J":"ꦗ", //ja
        "K":"ꦏ", //ka
        "L":"ꦭ", //la
        "M":"ꦩ", //ma
        "N":"ꦤ", //na
        "O":"ꦎ", //O
        "P":"ꦥ", //pa
        "Q":"ꦐ", //pangkon
        "R":"ꦫ", //ra
        "S":"ꦱ", //sa
        "T":"ꦠ", //ta
        "U":"ꦈ", //U
        "V":"ꦮ꦳", //va rekan
        "W":"ꦮ", //wa
        "X":"ꦼ", //pepet
        "Y":"ꦪ", //ya
        "Z":"ꦰ" //Sa Mahaprana
        //test: ABaCaDaEFaGaHaJaKaLaMaNaOPaRaSaTaUVaWaXYaZa
    }
    var soundMap2 = { //26 uppercase for Murda (notice for J, Q, R, and Z)
        "A":"ꦄ", //A
        "B":"ꦨ", //Ba murda
        "C":"ꦖ", //Ca murda
        "D":"ꦣ", //Da murda
        "E":"ꦌ", //E
        "F":"ꦦ꦳", //Pa murda rekan
        "G":"ꦓ", //Ga murda
        "H":"ꦲ꦳", //H
        "I":"ꦆ", //I
        "J":"ꦙ", //Ja mahaprana
        "K":"ꦑ", //Ka murda
        "L":"ꦭ", //L
        "M":"ꦩ", //M
        "N":"ꦟ", //Na murda
        "O":"ꦎ", //O
        "P":"ꦦ", //Pa murda
        "Q":"ꦐ", //Ka Sasak
        "R":"ꦬ", //Ra Agung
        "S":"ꦯ", //Sa murda
        "T":"ꦡ", //Ta murda
        "U":"ꦈ", //U
        "V":"ꦮ꦳", //Wa rekan
        "W":"ꦮ", //W
        "X":"ꦼ", //X
        "Y":"ꦪ", //Y
        "Z":"ꦰ" //Sa mahaprana
        //test: ABaCaDaEFaGaHaJaKaLaMaNaOPaQaRaSaTaUVaWaXaYaZa
    }
    var soundMap3 = { //26 lowercase + 35 special, same for both Murda or non-Murda
        "a":"ꦲ", //ha
        "b":"ꦧ", //ba
        "c":"ꦕ", //ca
        "d":"ꦢ", //da
        "e":"ꦲꦺ", //he
        "f":"ꦥ꦳", //fa rekan
        "g":"ꦒ", //ga
        "h":"ꦃ", //wignyan, with zws
        "i":"ꦲꦶ", //hi
        "j":"ꦗ", //ja
        "k":"ꦏ", //ka
        "l":"ꦭ", //la
        "m":"ꦩ", //ma
        "n":"ꦤ", //na
        "o":"ꦲꦺꦴ", //ho
        "p":"ꦥ", //pa
        "q":"ꦐ", //pangkon
        "r":"ꦂ", //layar, with zws
        "s":"ꦱ", //sa
        "t":"ꦠ", //ta
        "u":"ꦲꦸ", //hu
        "v":"ꦮ꦳", //va rekan
        "w":"ꦮ", //wa
        "x":"ꦲꦼ", //hə
        "y":"ꦪ", //ya
        "z":"ꦗ꦳", //za rekan

        "È":"ꦌ", //È
        "É":"ꦌ", //É
        "Ê":"ꦄꦼ", //Ê
        "Ě":"ꦄꦼ", //Ě
        "Ĕ":"ꦄꦼ", //Ĕ
        "è":"ꦲꦺ", //hè
        "é":"ꦲꦺ", //hé
        "ê":"ꦲꦼ", //hê
        "ě":"ꦲꦼ", //hě
        "ĕ":"ꦲꦼ", //hĕ
        "ə":"ꦲꦼ", //hə
        "ɔ":"ꦲ", //hɔ
        "å":"ꦲ", //hɔ
        "ô":"ꦲ", //hô
        "â":"ꦲꦴ", //hâ
        "ā":"ꦲꦴ", //hā
        "ī":"ꦲꦷ", //hī
        "ū":"ꦲꦹ", //hū
        "ō":"ꦲꦼꦴ", //hō
        "Ñ":"ꦚ", //nya
        "ñ":"ꦚ", //nya
        "ɲ":"ꦚ", //nya
        "Ŋ":"ꦔ", //nga
        "ŋ":"ꦔ", //nga
        "Ṇ":"ꦟ", //Na Murda
        "ṇ":"ꦟ", //Na Murda
        "Ḍ":"ꦝ", //dha / ḍa (Indic)
        "ḍ":"ꦝ", //dha / ḍa (Indic)
        "Ṭ":"ꦛ", //tha / ṭa (Indic)
        "ṭ":"ꦛ", //tha / ṭa (Indic)
        "ś":"ꦯ", //Sa Murda
        "Ṣ":"ꦰ", //Sa Mahaprana
        "ṣ":"ꦰ", //Sa Mahaprana
        "Ṛ":"ꦽ", //Cakra keret, somehow was categorized as vocal
        "ṛ":"ꦽ" //idem
        //test: Èè.Éé.Êê.Ěě.Ĕĕ.Ṛṛ.ôâāīūōåɔə
        //test: ḌaḍaṆaṇaṢaṣaṬaṭaŊaŋaÑañaɲaśa
    }
    var soundMap, murda;
    var modeMurda = document.getElementsByName("murda");
    for(var rad in modeMurda) {
      if(modeMurda[rad].checked)
        murda = modeMurda[rad].value;
    }
    if(murda == "pakai")
      soundMap = {...soundMap2, ...soundMap3};
    else //if(murda == "tidak")
      soundMap = {...soundMap1, ...soundMap3};

    var h_shift = GetShift(str);
    var core = str;

    if (h_shift["CoreSound"] == null) {

        if (soundMap[str.charAt(0)]) core = soundMap[str.charAt(0)];
        return {
            "CoreSound": core,
            "len": 1
        };
    } else {
        return h_shift;
    }
}
function GetSpecialSound(str) {
    specialsoundMap = { "f":"ꦥ꦳꧀", "v":"ꦮ꦳꧀", "z":"ꦗ꦳꧀", "ś":"ꦯ꧀", "Q":"ꦐ꧀", "q":"ꦐ꧀"/*pangkon*/ }
    if(specialsoundMap[str]!==undefined){
        return specialsoundMap[str];
    }
    return null;
}
/***************************
VII. Function ResolveCharacterSound
return tanda baca, digit, vokal, maupun nglegana+pangkon
****************************/
function ResolveCharacterSound( /*char*/ c) {
    var str = "" + c;
    var len = 0;
    if (isDigit(c)) {
        return "" + ('꧇' + (c - '0'));
    } else if (isHR(str[0])) {
        return "" + GetCoreSound(str).CoreSound; //layar dan wignyan
    } else if (isCJ(str[1])) {
        return "" + GetCoreSound(str).CoreSound + "꧀"; //anuswara
    } else if (isConsonant(str[0])) {
        return "" + GetCoreSound(str).CoreSound + "꧀";
    } else { //if (isVowel(str[0])) {
        return "" + GetCoreSound(str).CoreSound;
    }
/**/
}
/***************************
VIII. Function GetSound
fungsi yang mentransliterasi masing-masing suku kata
****************************/
function GetSound(str) {
    var len = 0;
    str = SuperTrim(str);
    str2 = str.toLowerCase();
    if (str == null || str == "") {
        return "";
    }
        var SpecialSound = GetSpecialSound(str);

    if (SpecialSound != null && str.length == 1) {
        return SpecialSound;
    }
    if (str.length == 1) {
        return ResolveCharacterSound(str[0]);
    } else {
        var core_sound = GetCoreSound(str);
        //return "1"+core_sound.CoreSound+"2";
        var matra = "";
        var konsonan = "";
            if (core_sound.len >= 1) {
                matra = GetMatra(str.substring(core_sound.len)); //xeiou (pepet, taling, suku, taling tarung, wulu, dll.)
                /*if () {

                } else {

                }*/
            } else {
                matra = ""; } //a/å/ɔ

/* rules for some cluster like ngg- that have different behaviour depending if it's the start of a word or not.
TODO: find more elegant solution */
        if (str2.indexOf("nggr") == 0) { //nggr-
            if (vowelPrev) konsonan = "ꦁ​ꦒꦿ";//<vowel>nggr-, e.g. panggrahita
            //else if (matra = "")
            else konsonan = "ꦔ꧀ꦒꦿ";//<nonvowel>nggr-, i.e. nggronjal
        } else if (str2.indexOf("nggl") == 0) { //nggl-, e.g. ngglantung
            konsonan = "ꦔ꧀ꦒ꧀ꦭ";
        } else if (str2.indexOf("nggw") == 0) { //nggw-, e.g. munggwing
            konsonan = "ꦔ꧀ꦒ꧀ꦮ";
        } else if (str2.indexOf("nggy") == 0) { //nggy-, e.g. anggyat
            konsonan = "ꦔ꧀ꦒꦾ";
        } else if (str2.indexOf("ngg") == 0) { //ngg-
            if (vowelPrev) konsonan = "ꦁ​ꦒ";//<vowel>ngg-, e.g. tunggal
            //else if (spacePrev) konsonan = "​ꦔ꧀";//<space>ngg-, e.g. ditinggal nggambar (it has a zws)
            else konsonan = "ꦔ꧀ꦒ";//<nonvowel>ngg-, i.e. nggambar
            //for cluster longer than 4 consonants, such as "ditinggalnggambar",
            //need to separate it by a space, "ditinggal nggambar" to be correct

        } else if (str2.indexOf("rlx") == 0) { //r lx, e.g. pasarlxgi
            konsonan = "ꦂꦊ"; matra = "";
        } else if (str2.indexOf("rrx") == 0) { //r rx
            konsonan = "ꦂꦉ"; matra = "";
        } else if (str2.indexOf("hlx") == 0) { //h lx
            if (vowelPrev) { konsonan = "ꦃꦊ"; matra = ""; }
            else konsonan = "ꦲ꧀ꦭꦼ"; matra = "";
        } else if (str2.indexOf("hrx") == 0) { //h rx
            if (vowelPrev) { konsonan = "ꦃꦉ"; matra = ""; }
            else konsonan = "ꦲꦽ"; matra = "";
        } else if (str2.indexOf("qlx") == 0) { //just pasangan la + pepet
            konsonan = "꧀ꦭꦼ"; matra = "";
        } else if (str2.indexOf("qrx") == 0) { //just cakra keret
            konsonan = "ꦽ"; matra = "";

        } else if (core_sound.CoreSound == "ꦂꦂꦮ") { // -rw-
            if (vowelPrev) konsonan = "ꦂꦮ";//-rw- -- arwana
            else konsonan = "ꦫ꧀ꦮ";//rw- -- rwa/rwi/rwab
        } else if (core_sound.CoreSound == "ꦃꦃꦭ") { // -hl-
            if (vowelPrev) konsonan = "ꦃꦭ";//-hl-
            else konsonan = "ꦲ꧀ꦭ";//hlam
        } else if (core_sound.CoreSound == "ꦃꦃꦮ") { // -hw-
            if (vowelPrev) konsonan = "ꦃꦮ";//-hw-
            else konsonan = "ꦲ꧀ꦮ";//hwab,hwan
        } else if (core_sound.CoreSound == "ꦃꦲꦾ") { // -hy-
            if (vowelPrev) konsonan = "ꦃꦪ";//sembahyang
            else konsonan = "ꦲꦾ";//hyang
/* rules for some characters that change depends on the matra/vowel (e.g. lx and rx, and -rx) */

        } else if (findstr(core_sound.CoreSound,'ꦾ') && matra == "꧀") { // pengkal
            konsonan = core_sound.CoreSound; matra = "";//-y-
        } else if (findstr(core_sound.CoreSound,'ꦿ') && matra == "꧀") { // cakra
            konsonan = core_sound.CoreSound; matra = "";//-r-
        } else if (findstr(core_sound.CoreSound,'ꦿ') && matra == "ꦼ") { // cakra keret
            if ((str[0] == "n" && str[1] == "y") || ((str[0] == "t" || str[0] == "d") && str[1] == "h")) {
               konsonan = GetCoreSound(str[0]+str[1]).CoreSound + "ꦽ"; matra = "";//nyrê-, thrê-, dhrê-
            } else if (str[0] == "n" && str[1] == "g") {
               if (str[2] == "g") konsonan = "ꦔ꧀ꦒꦽ"; else konsonan = "ꦔꦽ"; matra = "";//nggrê-/ngrê-
            } else { konsonan = GetCoreSound(str[0]).CoreSound + "ꦽ"; matra = "";//-rê-
            }
        } else if (findstr(core_sound.CoreSound, 'ꦭ') && matra == "ꦼ") { // nga lelet
            if ((str[0] == "n" && str[1] == "y") || ((str[0] == "t" || str[0] == "d") && str[1] == "h")) {
               konsonan = GetCoreSound(str[0]+str[1]).CoreSound + "꧀ꦭꦼ"; matra = "";//nylê-, thlê-, dhlê-
            } else if (str[0] == "n" && str[1] == "g") {
               if (str[2] == "g") konsonan = "ꦔ꧀ꦒ꧀ꦭꦼ"; else konsonan = "ꦔ꧀ꦭꦼ"; matra = "";//ngglê-/nglê-
            } else if (str[0] == "l") {
               konsonan = "ꦊ"; matra = "";//-lê-
            } else { konsonan = GetCoreSound(str[0]).CoreSound + "꧀ꦭꦼ"; matra = "";//-lê-
            }

        } else if (core_sound.CoreSound == 'ꦃ' && matra == "꧀") { // wignyan - 12 April
            konsonan = "ꦲ"; //ha
        } else if (core_sound.CoreSound == 'ꦃ' && matra != "꧀") { // wignyan
            konsonan = "ꦲ"; //ha
        } else if (core_sound.CoreSound == 'ꦂ' && matra == "ꦼ") { // pa cerek
            konsonan = "ꦉ"; matra = "";//rê
        } else if (core_sound.CoreSound == 'ꦂ' && matra == "꧀") { // layar
            konsonan = "ꦫ"; //ra
        } else if (core_sound.CoreSound == 'ꦂ' && matra != "꧀") { // layar
            konsonan = "ꦫ"; //ra
        } else if (core_sound.CoreSound == 'ꦁ​' && matra == "꧀") { // cecak
            konsonan = "ꦁ​"; matra = "";//cecak
        } else if (core_sound.CoreSound == 'ꦁ​' && matra != "꧀") { // cecak
            konsonan = "ꦔ"; //nga
        } else {
            konsonan = core_sound.CoreSound;
        }
        return "" + konsonan + matra;
    }
}
/***************************
IX. Function DoTransliterate
fungsi utama yang dipanggil (main function)
****************************/
function DoTransliterate(str) {
    var i = 0;
    var ret = "";
    var pi = 0; //?offset
    var vowelFlag = false, angkaFlag = false, cecakFlag=false;
    var angka = {"0":'꧐',"1":'꧑',"2":'꧒',"3":'꧓',"4":'꧔',"5":'꧕',"6":'꧖',"7":'꧗',"8":'꧘',"9":'꧙'}
    str = SuperTrim(str);

    while (i < str.length) {
        if (i > 0 && isVowel(str[i]) && isVowel(str[i-1])) { //deal with words that start with multiple vocals
           if ((str[i-1] == 'a' && str[i] == 'a') || (str[i-1] == 'i' && str[i] == 'i') || (str[i-1] == 'u' && str[i] == 'u') || (str[i-1] == 'a' && str[i] == 'i') || (str[i-1] == 'a' && str[i] == 'u')) {//specials
              if (i == 1 || (i > 1 && !isConsonant(str[i-2]))) { //for example if starts with 'ai-'
                   str = str.substring(0, i)+'h'+str.substring(i, str.length);
              } else {
                    var modeDiftong = document.getElementsByName("diftong");
                    for(var rad in modeDiftong) {
                      if(modeDiftong[rad].checked)
                        diftong = modeDiftong[rad].value;
                    }
                    if(diftong == "pakai")
                    { //do nothing, look in matramap table
                    }
                    else //if(diftong == "tidak")
                    { str = str.substring(0, i)+'h'+str.substring(i, str.length);
                    }
                }
           } else if ((str[i-1] == 'e' || str[i-1] == 'è' || str[i-1] == 'é') && (str[i] == 'a' || str[i] == 'o')) {//-y-
               str = str.substring(0, i)+'y'+str.substring(i, str.length);
           } else if ((str[i-1] == 'i') && (str[i] == 'a' || str[i] == 'e' || str[i] == 'è' || str[i] == 'é' || str[i] == 'o' || str[i] == 'u')) {//-y-
               str = str.substring(0, i)+'y'+str.substring(i, str.length);
           } else if ((str[i-1] == 'o') && (str[i] == 'a' || str[i] == 'e' || str[i] == 'è' || str[i] == 'é')) {//-w-
               str = str.substring(0, i)+'w'+str.substring(i, str.length);
           } else if ((str[i-1] == 'u') && (str[i] == 'a' || str[i] == 'e' || str[i] == 'è' || str[i] == 'é' || str[i] == 'i' || str[i] == 'o')) {//-y-
               str = str.substring(0, i)+'w'+str.substring(i, str.length);
           } else {
               str = str.substring(0, i)+'h'+str.substring(i, str.length);
           }
        }
        if ((isSpecial(str[i]) || isLW(str[i]) || isCJ(str[i])) && !vowelFlag) {
            //i++;
        } else if ((str[i] == 'h' && vowelFlag) || (!isVowel(str[i]) && i > 0) || (str[i] == ' ') || isPunct(str[i]) || isDigit(str[i]) || ((i - pi) > 5)) {
            if (!isDigit(str[i]) && angkaFlag) { //turn off the flag
                ret+="꧇​";// with zws
                angkaFlag = false;
            }
            if (pi < i) {
                if (cecakFlag && GetSound(str.substring(pi, i)) == "ꦁ") {
                    cecakFlag = false;
                    ret += "ꦔ꧀ꦔ";
                } else if (!cecakFlag && GetSound(str.substring(pi, i)) == "ꦁ") {
                    cecakFlag = true;
                    ret += "ꦁ​";
                } else {
                    cecakFlag = false;
                    ret += GetSound(str.substring(pi, i));
                }
            }
            if (str[i] == ' ') {
              var spasi, modeSpasi;
              var pakaiSpasi = document.getElementsByName("spasi");
              for(var rad in pakaiSpasi) {
                if(pakaiSpasi[rad].checked)
                  modeSpasi = pakaiSpasi[rad].value;
              }
              if(modeSpasi == "without") {
                //if space preceeded by open vowel, or layar/wignyan (therefore, no pangkon/virama)
              	if (i > 0 && ['a', 'e', 'i', 'o', 'u', 'r', 'h', 'ě'].indexOf(str[i-1]) >= 0) {
              		spasi = '​'; // zero-width space
              	} else {
              		spasi = ''; 
              	}
              } else { //if(mode == "with")
              	spasi = '​'; // zero-width space
              	//spasi = ' '; }//hair space http://en.wikipedia.org/wiki/Space_(punctuation)#Spaces_in_Unicode
              }
              ret += spasi; }
            if (isPunct(str[i])) {
             if (str[i] == '.') {
                ret += "꧉​"; //titik+zero-width space
                pi = i + 1;
             } else if (str[i] == ',') {
                ret += "꧈​"; //koma+zero-width space
                pi = i + 1;
             } else if (str[i] == ':') {
                ret += "꧇​"; //titik dua+zero-width space
                pi = i + 1;
             } else if (str[i] == '|') {
                ret += "꧋"; pi = i + 1;
/* comment out, not really a good way to do brackets
             } else if (str[i] == '(') {
                ret += "꧌"; pi = i + 1;
             } else if (str[i] == ')') {
                ret += "꧍​"; pi = i + 1;// with zws
*/
             } else if (str[i] == '-') {//tanda hubung
                ret += "​"; pi = i + 1;
             } else if (str[i] == '?' || str[i] == '!' || str[i] == '"' || str[i] == "'") {//tanda tanya/seru/petik
                ret += "​"; //zero-width space
                pi = i + 1;
             } else {
                ret += str[i]; pi = i + 1;
             }
            } else if (isDigit(str[i])) {
                if (!angkaFlag) ret+="꧇";
                ret += angka[str[i]];
                angkaFlag = true;
                pi = i + 1;
            } else {
                pi = i; }
            vowelFlag = false;
        } else if (isVowel(str[i]) && str[i] != 'h') {
            if (!isDigit(str[i]) && angkaFlag) { //turn off the flag
                ret+="꧇​"; //with zws
                angkaFlag = false;
            }
            vowelFlag = true;
        }
        if (pi > 0 && isVowel(str[pi-1])) {//<vowel>ngg
            vowelPrev = true;
        }
        else vowelPrev = false;
        /* not working
        if (pi > 0 && findstr(" ",str[pi-1])) {//<vowel>ngg
            spacePrev = true;
        }
        else spacePrev = false;*/
        i++;
    } //endwhile
    if (pi < i) {
        ret += GetSound(str.substring(pi, i)); }
    return SuperTrim(ret);
}
