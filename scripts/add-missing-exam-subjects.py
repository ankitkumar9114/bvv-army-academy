# Subject rows for the 22 exams the guide gives no written subjects for (owner request: "add all the subject data in all
# the courses"). Source: patterns of recent official notices; counts only where they are stable. Verify each cycle.
import json, os
SEED = 'firestore-seed'
def S(en, hi, hg, q=None, m=None):
    r = {'subject': (en, hi, hg)}
    if q is not None: r['questions'] = q
    if m is not None: r['marks'] = m
    return r
SSB = [
  S('Screening: OIR test + PPDT', 'स्क्रीनिंग: ओआईआर टेस्ट + पीपीडीटी', 'Screening: OIR test + PPDT'),
  S('Psychology tests: TAT, WAT, SRT, Self Description', 'मनोवैज्ञानिक टेस्ट: टीएटी, डब्ल्यूएटी, एसआरटी, सेल्फ डिस्क्रिप्शन', 'Psychology tests: TAT, WAT, SRT, Self Description'),
  S('Group Testing (GTO) tasks', 'ग्रुप टेस्टिंग (जीटीओ) टास्क', 'Group Testing (GTO) tasks'),
  S('Personal interview', 'व्यक्तिगत इंटरव्यू', 'Personal interview'),
  S('Conference', 'कॉन्फ़्रेंस', 'Conference'),
]
SSB_STAGE = ('ssb', ('SSB interview (5 days)', 'एसएसबी इंटरव्यू (5 दिन)', 'SSB interview (5 din)'))
# exam id -> list of (stage id, stage name or None if the stage exists, rows)
DATA = {
 'ibps-rrb-officer-scale-2-3': [('online-exam', ('Single online exam', 'एकल ऑनलाइन परीक्षा', 'Single online exam'), [
   S('Reasoning', 'रीज़निंग', 'Reasoning', 40, 50), S('Quantitative Aptitude', 'क्वांटिटेटिव एप्टीट्यूड', 'Quantitative Aptitude', 40, 50),
   S('Financial Awareness', 'फ़ाइनेंशियल अवेयरनेस', 'Financial Awareness', 40, 40), S('English / Hindi Language', 'अंग्रेज़ी / हिंदी भाषा', 'English / Hindi Language', 40, 40),
   S('Computer Knowledge', 'कंप्यूटर ज्ञान', 'Computer Knowledge', 40, 20), S('Professional Knowledge (specialist posts)', 'प्रोफ़ेशनल नॉलेज (स्पेशलिस्ट पद)', 'Professional Knowledge (specialist posts)', 40, 40)])],
 'sbi-so': [('online-test', None, [
   S('Professional Knowledge', 'प्रोफ़ेशनल नॉलेज', 'Professional Knowledge'), S('Reasoning', 'रीज़निंग', 'Reasoning'),
   S('Quantitative Aptitude', 'क्वांटिटेटिव एप्टीट्यूड', 'Quantitative Aptitude'), S('English Language', 'अंग्रेज़ी भाषा', 'English Language'),
   S('General Awareness (Banking)', 'सामान्य जागरूकता (बैंकिंग)', 'General Awareness (Banking)')])],
 'exim-bank-mt': [('online-test', None, [
   S('English Language', 'अंग्रेज़ी भाषा', 'English Language'), S('Reasoning', 'रीज़निंग', 'Reasoning'),
   S('Quantitative Aptitude', 'क्वांटिटेटिव एप्टीट्यूड', 'Quantitative Aptitude'),
   S('General / Economy / Banking Awareness', 'सामान्य / अर्थव्यवस्था / बैंकिंग जागरूकता', 'General / Economy / Banking Awareness'),
   S('Professional Knowledge', 'प्रोफ़ेशनल नॉलेज', 'Professional Knowledge')])],
 'lic-ado': [
   ('prelims', None, [S('Reasoning', 'रीज़निंग', 'Reasoning', 35, 35), S('Numerical Ability', 'न्यूमेरिकल एबिलिटी', 'Numerical Ability', 35, 35), S('English Language', 'अंग्रेज़ी भाषा', 'English Language', 30, 30)]),
   ('mains', None, [S('Reasoning', 'रीज़निंग', 'Reasoning', 40, 50), S('Numerical Ability', 'न्यूमेरिकल एबिलिटी', 'Numerical Ability', 40, 50),
     S('General Knowledge & Current Affairs', 'सामान्य ज्ञान और करेंट अफ़ेयर्स', 'General Knowledge aur Current Affairs', 40, 50),
     S('Insurance & Marketing Awareness', 'बीमा और मार्केटिंग जागरूकता', 'Insurance aur Marketing Awareness', 40, 50)])],
 'lic-assistant': [
   ('prelims', None, [S('English / Hindi Language', 'अंग्रेज़ी / हिंदी भाषा', 'English / Hindi Language', 30, 30), S('Reasoning', 'रीज़निंग', 'Reasoning', 35, 35), S('Numerical Ability', 'न्यूमेरिकल एबिलिटी', 'Numerical Ability', 35, 35)]),
   ('mains', None, [S('General & Financial Awareness', 'सामान्य और वित्तीय जागरूकता', 'General aur Financial Awareness', 50, 50), S('General English', 'सामान्य अंग्रेज़ी', 'General English', 40, 40),
     S('Reasoning', 'रीज़निंग', 'Reasoning', 40, 50), S('Quantitative Aptitude', 'क्वांटिटेटिव एप्टीट्यूड', 'Quantitative Aptitude', 40, 50)])],
 'niacl-assistant': [
   ('prelims', None, [S('English Language', 'अंग्रेज़ी भाषा', 'English Language', 30, 30), S('Reasoning', 'रीज़निंग', 'Reasoning', 35, 35), S('Quantitative Aptitude', 'क्वांटिटेटिव एप्टीट्यूड', 'Quantitative Aptitude', 35, 35)]),
   ('mains', None, [S('Reasoning', 'रीज़निंग', 'Reasoning', 40, 50), S('English Language', 'अंग्रेज़ी भाषा', 'English Language', 40, 50),
     S('General Awareness', 'सामान्य जागरूकता', 'General Awareness', 40, 50), S('Computer Knowledge', 'कंप्यूटर ज्ञान', 'Computer Knowledge', 40, 50),
     S('Quantitative Aptitude', 'क्वांटिटेटिव एप्टीट्यूड', 'Quantitative Aptitude', 40, 50)])],
 'territorial-army': [('written', None, [S('Reasoning', 'रीज़निंग', 'Reasoning', 50, 50), S('Elementary Mathematics', 'प्रारंभिक गणित', 'Elementary Mathematics', 50, 50),
   S('General Knowledge', 'सामान्य ज्ञान', 'General Knowledge', 50, 50), S('English', 'अंग्रेज़ी', 'English', 50, 50)])],
 'coast-guard-navik-yantrik': [('stage1', None, [
   S('Mathematics', 'गणित', 'Mathematics', 20), S('General Science', 'सामान्य विज्ञान', 'General Science', 10), S('English', 'अंग्रेज़ी', 'English', 15),
   S('Reasoning', 'रीज़निंग', 'Reasoning', 5), S('General Knowledge', 'सामान्य ज्ञान', 'General Knowledge', 10),
   S('Maths & Physics (Navik GD, Section II)', 'गणित और भौतिकी (नाविक जीडी, सेक्शन II)', 'Maths aur Physics (Navik GD, Section II)', 50),
   S('Electrical / Mechanical / Electronics engineering (Yantrik)', 'इलेक्ट्रिकल / मैकेनिकल / इलेक्ट्रॉनिक्स इंजीनियरिंग (यांत्रिक)', 'Electrical / Mechanical / Electronics engineering (Yantrik)', 50)])],
 'coast-guard-ac': [('cgcat', None, [S('English', 'अंग्रेज़ी', 'English', 25), S('Reasoning & Numerical Ability', 'रीज़निंग और न्यूमेरिकल एबिलिटी', 'Reasoning aur Numerical Ability', 25),
   S('General Science & Mathematics', 'सामान्य विज्ञान और गणित', 'General Science aur Mathematics', 25), S('General Knowledge', 'सामान्य ज्ञान', 'General Knowledge', 25)])],
 'army-tes': [(SSB_STAGE[0], SSB_STAGE[1], SSB)], 'navy-btech-entry': [(SSB_STAGE[0], SSB_STAGE[1], SSB)],
 'army-tgc-ssc-tech': [(SSB_STAGE[0], SSB_STAGE[1], SSB)], 'ncc-special-entry': [(SSB_STAGE[0], SSB_STAGE[1], SSB)], 'army-jag': [(SSB_STAGE[0], SSB_STAGE[1], SSB)],
 'capf-medical-officer': [('interview', None, [S('Medical subjects (MBBS level) revision', 'मेडिकल विषय (एमबीबीएस स्तर) का रिवीज़न', 'Medical subjects (MBBS level) revision'),
   S('Interview & personality', 'इंटरव्यू और व्यक्तित्व', 'Interview aur personality'), S('Current affairs & health policy', 'करेंट अफ़ेयर्स और स्वास्थ्य नीति', 'Current affairs aur health policy')])],
 'rpf-si': [('cbt', ('Computer-based test (CBT)', 'कंप्यूटर आधारित परीक्षा (सीबीटी)', 'Computer-based test (CBT)'), [
   S('General Awareness', 'सामान्य जागरूकता', 'General Awareness', 50, 50), S('Arithmetic', 'अंकगणित', 'Arithmetic', 35, 35),
   S('General Intelligence & Reasoning', 'सामान्य बुद्धि और रीज़निंग', 'General Intelligence aur Reasoning', 35, 35)])],
 'rrb-ministerial-isolated': [('cbt', ('Computer-based test (CBT)', 'कंप्यूटर आधारित परीक्षा (सीबीटी)', 'Computer-based test (CBT)'), [
   S('Professional ability (post subject)', 'प्रोफ़ेशनल एबिलिटी (पद का विषय)', 'Professional ability (post ka subject)', 50), S('General Awareness', 'सामान्य जागरूकता', 'General Awareness', 15),
   S('General Intelligence & Reasoning', 'सामान्य बुद्धि और रीज़निंग', 'General Intelligence aur Reasoning', 15), S('Mathematics', 'गणित', 'Mathematics', 10),
   S('General Science', 'सामान्य विज्ञान', 'General Science', 10)])],
 'rrc-act-apprentice': [('coursework', ('What the course covers (selection is on 10th + ITI marks)', 'कोर्स में क्या पढ़ाया जाता है (चयन 10वीं + आईटीआई अंकों पर)', 'Course mein kya padhaya jaata hai (selection 10th + ITI marks par)'), [
   S('ITI trade theory', 'आईटीआई ट्रेड थ्योरी', 'ITI trade theory'), S('Workshop calculation & science', 'वर्कशॉप कैलकुलेशन और साइंस', 'Workshop calculation aur science'),
   S('Engineering drawing', 'इंजीनियरिंग ड्रॉइंग', 'Engineering drawing'), S('Workshop safety & practice', 'वर्कशॉप सुरक्षा और प्रैक्टिस', 'Workshop safety aur practice')])],
 'mp-police-si-subedar': [('written', ('Written exam (MPESB)', 'लिखित परीक्षा (एमपीईएसबी)', 'Written exam (MPESB)'), [
   S('General Knowledge & Current Affairs (incl. MP)', 'सामान्य ज्ञान और करेंट अफ़ेयर्स (एमपी सहित)', 'General Knowledge aur Current Affairs (MP sahit)'),
   S('Hindi', 'हिंदी', 'Hindi'), S('English', 'अंग्रेज़ी', 'English'), S('Computer Knowledge', 'कंप्यूटर ज्ञान', 'Computer Knowledge'),
   S('Reasoning', 'रीज़निंग', 'Reasoning'), S('Mathematics', 'गणित', 'Mathematics'), S('General Science', 'सामान्य विज्ञान', 'General Science')])],
 'mp-vanrakshak-excise': [('written', ('Written exam (MPESB)', 'लिखित परीक्षा (एमपीईएसबी)', 'Written exam (MPESB)'), [
   S('General Knowledge & MP GK', 'सामान्य ज्ञान और एमपी जीके', 'General Knowledge aur MP GK'), S('General Hindi', 'सामान्य हिंदी', 'General Hindi'),
   S('Mathematics', 'गणित', 'Mathematics'), S('General Science', 'सामान्य विज्ञान', 'General Science'), S('Reasoning', 'रीज़निंग', 'Reasoning')])],
 'upsc-ifos': [
   ('prelims', None, [S('General Studies Paper I', 'सामान्य अध्ययन पेपर I', 'General Studies Paper I', 100, 200), S('CSAT Paper II (qualifying)', 'सीसैट पेपर II (क्वालिफ़ाइंग)', 'CSAT Paper II (qualifying)', 80, 200)]),
   ('mains', None, [S('General English', 'सामान्य अंग्रेज़ी', 'General English', None, 300), S('General Knowledge', 'सामान्य ज्ञान', 'General Knowledge', None, 300),
     S('Optional subject 1 (2 papers)', 'वैकल्पिक विषय 1 (2 पेपर)', 'Optional subject 1 (2 papers)', None, 400), S('Optional subject 2 (2 papers)', 'वैकल्पिक विषय 2 (2 पेपर)', 'Optional subject 2 (2 papers)', None, 400)])],
 'upsc-geo-scientist': [
   ('prelims', None, [S('General Studies', 'सामान्य अध्ययन', 'General Studies', None, 100), S('Geology / Geophysics / Chemistry / Hydrogeology', 'भूविज्ञान / भूभौतिकी / रसायन / जलभूविज्ञान', 'Geology / Geophysics / Chemistry / Hydrogeology', None, 300)]),
   ('mains', None, [S('Specialist subject (3 descriptive papers)', 'विशेषज्ञ विषय (3 वर्णनात्मक पेपर)', 'Specialist subject (3 descriptive papers)', None, 600)])],
 'upsc-ies-iss': [('written', None, [S('General English', 'सामान्य अंग्रेज़ी', 'General English', None, 100), S('General Studies', 'सामान्य अध्ययन', 'General Studies', None, 100),
   S('Economics (IES) / Statistics (ISS) papers', 'अर्थशास्त्र (आईईएस) / सांख्यिकी (आईएसएस) पेपर', 'Economics (IES) / Statistics (ISS) papers', None, 800)])],
}
fire = {}
for f in os.listdir(f'{SEED}/en'):
    group = f[:-5]
    en = json.load(open(f'{SEED}/en/{f}'))
    tr = {l: json.load(open(f'{SEED}/{l}/{f}')) for l in ('hi', 'hinglish')}
    changed = False
    for i, ex in enumerate(en['exams']):
        if ex['id'] not in DATA: continue
        for sid, sname, rows in DATA[ex['id']]:
            idx = next((j for j, st in enumerate(ex['stages']) if st['id'] == sid), None)
            if idx is None:
                assert sname, (ex['id'], sid)
                ex['stages'].append({'id': sid, 'name': sname[0], 'rows': []})
                idx = len(ex['stages']) - 1
                tr['hi'][f'exams.{i}.stages.{idx}.name'] = sname[1]
                tr['hinglish'][f'exams.{i}.stages.{idx}.name'] = sname[2]
            st = ex['stages'][idx]
            assert not st['rows'], (ex['id'], sid, 'already has rows')
            for k, r in enumerate(rows):
                row = {'subject': r['subject'][0]}
                for key in ('questions', 'marks'):
                    if key in r: row[key] = r[key]
                st['rows'].append(row)
                tr['hi'][f'exams.{i}.stages.{idx}.rows.{k}.subject'] = r['subject'][1]
                tr['hinglish'][f'exams.{i}.stages.{idx}.rows.{k}.subject'] = r['subject'][2]
        changed = True
        fire[ex['id']] = (group, i)
    if changed:
        json.dump(en, open(f'{SEED}/en/{f}', 'w'), ensure_ascii=False, indent=2); open(f'{SEED}/en/{f}', 'a').write('\n')
        for l in ('hi', 'hinglish'):
            json.dump(tr[l], open(f'{SEED}/{l}/{f}', 'w'), ensure_ascii=False, indent=2); open(f'{SEED}/{l}/{f}', 'a').write('\n')
print('updated exams:', len(fire), sorted(fire))
json.dump(fire, open('/private/tmp/claude-501/-Users-ankit-Documents-Vibe-Coading-Coaching-website/8ab3a214-572a-47c5-a061-9d7b9cc00494/scratchpad/subject-exams.json', 'w'))
