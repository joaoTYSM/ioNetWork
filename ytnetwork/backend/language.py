import re


DEFAULTS = {
    "pt": ["em alta hoje", "melhores momentos", "música brasileira", "tecnologia"],
    "en": ["trending today", "best moments", "music", "technology"],
    "es": ["tendencias hoy", "mejores momentos", "música latina", "tecnología"],
    "fr": ["tendances aujourd'hui", "meilleurs moments", "musique française", "technologie"],
    "de": ["trends heute", "beste momente", "deutsche musik", "technik"],
    "it": ["tendenze oggi", "momenti migliori", "musica italiana", "tecnologia"],
    "ja": ["人気 急上昇", "音楽", "ゲーム実況", "ニュース"],
    "ko": ["인기 급상승", "음악", "게임", "뉴스"],
    "ru": ["тренды сегодня", "музыка", "игры", "новости"],
    "hi": ["ट्रेंडिंग", "गाने", "मनोरंजन", "समाचार"],
    "ar": ["الأكثر رواجا", "موسيقى", "ألعاب", "أخبار"],
}





STOP = {
    "pt": "o a os as um uma de do da dos das em no na nos nas que não com para por mais como mas foi são ao você vocês isso esse essa muito também até quando eu meu minha".split(),
    "en": "the and of to in is you that it for on with this are was be as at your how what from my we they not but have".split(),
    "es": "el la los las un una de del en que y con para por más como pero fue son al tú usted esto este esta muy también hasta cuando yo mi mis".split(),
    "fr": "le la les un une des du de en et que qui pour pas avec sur dans est sont au aux ce cette très aussi mais je mon ma".split(),
    "de": "der die das und ein eine ist nicht mit für auf von zu den dem des sich auch wie aber ich du wir sie es im".split(),
    "it": "il lo la le gli un una di del della in che e per non con su come più ma è sono al questo questa molto anche io mio".split(),
}
SCRIPTS = [(r"[\u3040-\u30ff]", "ja"), (r"[\uac00-\ud7af]", "ko"), (r"[\u0400-\u04ff]", "ru"),
           (r"[\u0900-\u097f]", "hi"), (r"[\u0600-\u06ff]", "ar")]
STOP = {k: set(v) for k, v in STOP.items()}


def lang_of(t):
    t = t or ""
    for rg, l in SCRIPTS:
        if re.search(rg, t):
            return l
    if re.search(r"[ãõ]", t.lower()):
        return "pt"
    if "ñ" in t.lower():
        return "es"
    w = set(re.findall(r"[a-zà-ÿ']+", t.lower()))
    best, top, tie = None, 0, False
    for l, s in STOP.items():
        n = len(w & s)
        if n > top:
            best, top, tie = l, n, False
        elif n == top and n:
            tie = True
    return None if tie else best
