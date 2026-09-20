import type { DiveCenterEnrichment, DiveSiteEnrichment } from './types.ts'

type SiteLocalizedFields = Pick<
  DiveSiteEnrichment,
  | 'summaryEn'
  | 'summaryTr'
  | 'descriptionEn'
  | 'descriptionTr'
  | 'highlightsEn'
  | 'highlightsTr'
  | 'marineLifeEn'
  | 'marineLifeTr'
  | 'visibilityEn'
  | 'visibilityTr'
  | 'currentNotesEn'
  | 'currentNotesTr'
  | 'experienceNotesEn'
  | 'experienceNotesTr'
  | 'historyEn'
  | 'historyTr'
>

type CenterLocalizedFields = Pick<
  DiveCenterEnrichment,
  | 'descriptionEn'
  | 'descriptionTr'
  | 'openingHoursEn'
  | 'openingHoursTr'
  | 'servicesEn'
  | 'servicesTr'
  | 'coursesEn'
  | 'coursesTr'
  | 'boatTripsEn'
  | 'boatTripsTr'
  | 'rentalsEn'
  | 'rentalsTr'
>

type TurkishSiteCopy = Partial<
  Pick<
    SiteLocalizedFields,
    | 'summaryTr'
    | 'descriptionTr'
    | 'highlightsTr'
    | 'marineLifeTr'
    | 'visibilityTr'
    | 'currentNotesTr'
    | 'experienceNotesTr'
    | 'historyTr'
  >
>

const siteCopyTr: Record<string, TurkishSiteCopy> = {
  'Adelaide Baker (Shipwreck Trail)': {
    summaryTr: 'Coffins Patch Resifi’ndeki 19. yüzyıldan kalma ahşap bir yelkenlinin dağınık kalıntıları.',
    descriptionTr: 'Yaklaşık 6 metre derindeki kalıntılar iki ana grupta toplanır; direk parçaları, tanklar, arma ve demir yapı elemanları deniz canlılarına yaşam alanı sağlar.',
    highlightsTr: ['Yaklaşık 23 metrelik demir direk', 'İki ana arkeolojik kalıntı grubu'],
    marineLifeTr: ['Gorgonlar', 'Süngerler', 'Kabuklaşan mercanlar'],
    experienceNotesTr: 'Sığ olsa da arkeolojik kalıntılar hassastır ve dokunulmamalıdır.',
    historyTr: '1863’te Maine’de F. W. Carver adıyla inşa edildi; daha sonra Adelaide Baker adını aldı ve 1889’da Coffins Patch Resifi’ne çarparak battı.',
  },
  'Adolphus Busch Wreck': {
    summaryTr: 'Lower Keys’te kum zeminde dik duran, 64 metrelik yapay resif batığı.',
    descriptionTr: 'Bütünlüğünü koruyan yük gemisi 1998’de yaklaşık 34 metre derinliğe batırıldı; köprüüstü yaklaşık 21, ana güverte ise 27 metre derindedir.',
    highlightsTr: ['Köprüüstü', 'Ana güverte', 'Hazırlanmış geniş gövde açıklıkları'],
    marineLifeTr: ['Golyat orfozu', 'Tarpon', 'Lutjan balıkları', 'Baraküda', 'Resif köpekbalıkları'],
    experienceNotesTr: 'Hazırlanmış açıklıklar bulunsa da derinlik nedeniyle ileri seviye planlama gerektirir.',
    historyTr: '1951’de İskoçya’da inşa edildi ve 1998’de Lower Keys’in ilk yapay resifi olarak batırıldı.',
  },
  'Alligator Reef': {
    summaryTr: 'Tarihî Alligator Reef Deniz Feneri çevresindeki koruma altındaki sığ Islamorada resifi.',
    descriptionTr: 'Balık çeşitliliğiyle bilinen resif dalış, şnorkel ve mercan restorasyonu çalışmaları için kullanılır.',
    highlightsTr: ['Tarihî deniz feneri', 'Mercan restorasyon alanları'],
    marineLifeTr: ['Mürenler', 'Hemşire köpekbalıkları', 'Deniz kaplumbağaları', 'Çeşitli resif balıkları'],
    experienceNotesTr: 'Sığ profil rekreasyonel dalışa uygundur; güncel koşullar yine de işletmeciyle değerlendirilmelidir.',
  },
  'Amesbury Wreck (Shipwreck Trail)': {
    summaryTr: 'Key West’in batısında parçalanmış eski bir ABD Donanması eskort ve hızlı nakliye gemisi.',
    descriptionTr: 'Yaklaşık 180 metre aralıklı iki ana gövde ve üstyapı bölümünde top kaideleri, köprü kalıntıları ve mataforalar görülebilir.',
    highlightsTr: ['Beş inçlik top kaidesi', 'Çift 40 mm top kaidesi', 'Çıkarma aracı mataforaları'],
    historyTr: '1943’te hizmete giren Amesbury, Atlantik ve Pasifik’te görev yaptı; yapay resif için taşınırken fırtınada karaya oturup parçalandı.',
  },
  'Benwood Wreck (Shipwreck Trail)': {
    summaryTr: 'French Reef ile Dixie Shoals arasında yer alan, II. Dünya Savaşı döneminden popüler bir yük gemisi batığı.',
    descriptionTr: 'Yaklaşık 8–14 metre derinlikteki batığın en yüksek kısmı ezilmiş pruvasıdır; açık gövde iskeleti geniş bir alana yayılır.',
    highlightsTr: ['Ezilmiş pruva', 'Açık gövde iskeleti'],
    marineLifeTr: ['Homurtu balığı sürüleri', 'Domuz balıkları'],
    historyTr: 'Norveç yük gemisi, 9 Nisan 1942’de karartma koşullarında Robert C. Tuttle ile çarpıştı; daha sonra kurtarma ve hedef çalışmalarına konu oldu.',
  },
  'Bibb Wreck': {
    summaryTr: 'Key Largo açıklarında yapay resif olarak batırılmış derin bir Sahil Güvenlik gemisi.',
    descriptionTr: 'Bibb, Key Largo’nun öne çıkan derin batıklarındandır ve NOAA’nın yapay resif şamandıra noktaları arasında listelenir.',
    currentNotesTr: 'Derin batık dalışlarında kuvvetli akıntılarla karşılaşılabilir.',
    experienceNotesTr: 'İleri seviye ve derin dalış deneyimi uygundur.',
  },
  'Cayman Salvor Wreck': {
    summaryTr: 'NOAA’nın koruma alanı şamandıra sisteminde yer alan bir Key West yapay resif batığı.',
    descriptionTr: 'Yerel işletmeci bilgileri Cayman Salvager’ı Key West’ten ziyaret edilen batık dalışları arasında gösterir.',
  },
  'Coffins Patch': {
    summaryTr: 'Marathon ve Key Colony Beach açıklarındaki sığ parçalı resifler grubu.',
    descriptionTr: 'Koruma altındaki kompleks; birden çok şamandıra, sütun mercanları, geyik boynuzu mercan fidanlığı ve genellikle hafif akıntı sunar.',
    highlightsTr: ['Sütun mercan oluşumu', 'Geyik boynuzu mercan fidanlığı'],
    marineLifeTr: ['Tropik resif balıkları', 'Istakozlar', 'Zaman zaman kartal vatozları'],
    visibilityTr: 'Görüş genellikle iyidir; hareketlenen kum görüşü azaltabilir.',
    currentNotesTr: 'Akıntı genellikle hafiftir.',
    experienceNotesTr: 'Şnorkel, yeni dalgıçlar ve eğitim dalışları için uygun olarak tanımlanır.',
  },
  'Crocker Reef': {
    summaryTr: 'Sığ oluşumları ve daha derin vadileri bir arada sunan geniş Islamorada resif hattı.',
    descriptionTr: 'Alan, mahmuz-oluk yapıları, kum kanalları ve daha derin kuma doğru inen bölümler içerir.',
    marineLifeTr: ['Deniz kaplumbağaları', 'Hemşire köpekbalıkları', 'Vatozlar', 'Melek balıkları', 'Kelebek balıkları'],
  },
  'Davis Ledge': {
    summaryTr: 'Alçak bir set, deniz yelpazeleri ve oyuklar içeren sığ Islamorada resifi.',
    descriptionTr: 'Resif; süslü Buda heykeli, kaplumbağa yaşam alanı ve mercan restorasyon çalışmalarıyla bilinir.',
    highlightsTr: ['Sualtı Buda heykeli', 'I.CARE mercan dikimleri'],
    marineLifeTr: ['Deniz kaplumbağaları', 'Hemşire köpekbalıkları', 'Deniz yelpazeleri'],
    experienceNotesTr: 'Rahat dalışlar ve gece dalışı için kullanılan sığ bir noktadır.',
  },
  'Duane Wreck (Shipwreck Trail)': {
    summaryTr: 'Key Largo açıklarında dik duran ve büyük ölçüde bütünlüğünü koruyan Sahil Güvenlik gemisi.',
    descriptionTr: 'Gemi kum zeminde yaklaşık 37 metre derinlikte dik durur; gözcü yuvası 18, köprü 21 ve ana güverte yaklaşık 30 metrededir.',
    highlightsTr: ['Gözcü yuvası', 'Köprü ve üstyapı', 'Orijinal dümenler ve pervaneler'],
    currentNotesTr: 'NOAA, derin Shipwreck Trail noktalarında hızlı akıntı olabileceğini belirtir.',
    experienceNotesTr: 'Derinlik ve koşullara uygun eğitim ve planlama gerektiren bir batıktır.',
    historyTr: '1936’da inşa edilen Duane; savaş, kurtarma ve kolluk görevlerinden sonra 27 Kasım 1987’de yapay resif olarak batırıldı.',
  },
  'Eagle Wreck (Shipwreck Trail)': {
    summaryTr: 'Alligator Reef Light’ın kuzeydoğusunda sancak tarafına yatmış 87 metrelik yapay resif.',
    descriptionTr: 'Güverte korkulukları yaklaşık 21, pervane ve dümen 34 metre derindedir. Batık 1998’de Georges Kasırgası ile ikiye ayrıldı.',
    highlightsTr: ['Yük bomları', 'Direk yapıları', 'Demir zinciri'],
    historyTr: '1962’de denize indirilen yangın hasarlı yük gemisi hazırlanarak 1985’te yapay resif olarak batırıldı.',
  },
  'French Reef': {
    summaryTr: 'Açık geçişli oluşumlarıyla bilinen geniş ve sığ Key Largo resifi.',
    descriptionTr: 'Resif hattı boyunca mercan yapıları, kumluklar, setler ve Christmas Tree Cave ile Hourglass Cave gibi adlandırılmış açık geçitler bulunur.',
    highlightsTr: ['Christmas Tree Cave', 'Sand Bottom Cave', 'Hourglass Cave'],
    experienceNotesTr: 'Mercan çevresinde iyi yüzerlik kontrolü gerekir; “mağara” adlı yerler kapalı mağaralar değil, açık resif geçitleridir.',
  },
  'Key Largo Dry Rocks': {
    summaryTr: 'Christ of the Abyss heykeliyle tanınan sığ ve koruma altındaki resif.',
    descriptionTr: 'Bronz heykel sığ sudaki mercan oluşumları arasında yer alır ve dalgıçlar ile şnorkelciler tarafından görülebilir.',
    highlightsTr: ['Christ of the Abyss heykeli'],
    experienceNotesTr: 'Şnorkel ve rekreasyonel dalış için popülerdir; şamandıralar kullanılmalı ve mercana temastan kaçınılmalıdır.',
  },
  'Looe Key': {
    summaryTr: 'Yüksek balık ve mercan çeşitliliğine sahip, koruma altındaki Lower Keys mahmuz-oluk resifi.',
    descriptionTr: 'Looe Key sığ parçalı resifleri ve daha derin resif yapılarını barındırır; koruma alanı şamandıralarıyla hizmet verir.',
    highlightsTr: ['Geniş mercan oluşumları', 'Köklü koruma alanı'],
    marineLifeTr: ['Deniz kaplumbağaları', 'Snook', 'Permit', 'Trompet balığı', 'Ahtapot', 'Çeşitli resif balıkları'],
  },
  'Molasses Reef': {
    summaryTr: 'Çok sayıda şamandırası ve farklı profilleri bulunan, yoğun ziyaret edilen geniş Key Largo resifi.',
    descriptionTr: 'Resif; mercan başları, kum kanalları, tarihî batık izleri ve restorasyon alanları dâhil birçok ayrı dalış noktasından oluşur.',
    highlightsTr: ['Hole in the Wall', 'Spanish Anchor', 'Winch Hole', 'Wellwood restorasyon alanı'],
    marineLifeTr: ['Orfozlar', 'Resif köpekbalıkları', 'Kartal vatozları', 'Tropik resif balıkları'],
  },
  'North American': {
    summaryTr: '1842’de kaybolan North America olduğu düşünülen ancak kesin tanımlanmamış sığ ahşap batık.',
    descriptionTr: 'Alt gövde kalıntıları ve oval balast yığını, Delta Shoals yakınında kum ve deniz çayırı üzerinde yaklaşık 4 metre derinliktedir.',
    highlightsTr: ['Açığa çıkmış ahşap gövde elemanları', 'Taş balast'],
    historyTr: 'Mahkeme kayıtları 1842’de Delta Shoals’ta kaybolan üç direkli North America’yı anlatır; NOAA batığın kimliğinin kesin olmadığını belirtir.',
  },
  'Rocky Top': {
    summaryTr: 'Mercan restorasyonuyla ilişkili sığ bir Islamorada parçalı resifi.',
    descriptionTr: 'Key Dives, sağlıklı mercanları, homurtu balığı sürülerini ve I.CARE mercan dikim alanını belirtir.',
    highlightsTr: ['I.CARE mercan dikim alanı'],
    marineLifeTr: ['Yeşil deniz kaplumbağaları', 'Tomtate', 'Smallmouth grunts'],
  },
  'San Pedro Wreck (Shipwreck Trail)': {
    summaryTr: 'Indian Key’in güneyinde, 1733 İspanyol hazine filosuna ait sığ batık ve sualtı arkeoloji koruma alanı.',
    descriptionTr: 'Balast taşları, replika toplar, bilgilendirme levhası ve bir çapa; dalgıç ve şnorkelcilerin erişebildiği sığ yapay resif oluşturur.',
    highlightsTr: ['Balast yığını', 'Replika toplar', 'Bilgilendirme levhası'],
    marineLifeTr: ['Homurtu balıkları', 'Lutjan balıkları', 'Spadefish', 'Orfozlar', 'Mürenler'],
    experienceNotesTr: 'Başlangıç düzeyi şnorkelci ve dalgıçlar için uygun olarak tanımlanır; eserler ve deniz yaşamı koruma altındadır.',
    historyTr: 'Hollanda yapımı gemi 1733 İspanyol filosuyla kasırgada battı; daha sonra yoğun kurtarma faaliyetlerinin ardından eyalet ve federal korumaya alındı.',
  },
  'Sombrero Reef': {
    summaryTr: 'Tarihî Sombrero Key Deniz Feneri ile işaretlenen koruma altındaki Marathon resifi.',
    descriptionTr: 'Sığ mercan bahçeleri ve mahmuz-oluk yapıları bulunan resif, şnorkel ve rekreasyonel dalış için yaygın kullanılır.',
    highlightsTr: ['Sombrero Key Deniz Feneri'],
    marineLifeTr: ['Deniz kaplumbağaları', 'Hemşire köpekbalıkları', 'Güney vatozları', 'Papağan balıkları', 'Sarı kuyruklu lutjanlar'],
    currentNotesTr: 'Sakin günlerde bile akıntı olabilir.',
  },
  'Spiegel Grove Wreck': {
    summaryTr: 'Eski bir ABD Donanması havuzlu çıkarma gemisi olan 155 metrelik büyük Key Largo yapay resifi.',
    descriptionTr: 'Dev batık kum zeminde yaklaşık 40 metre derinlikte dik durur; ölçeği, üstyapısı ve gelişen resif ekosistemi birden fazla dalış gerektirebilir.',
    highlightsTr: ['Dev üstyapı', 'Anı plaketi', 'Birden çok bağlama şamandırası'],
    marineLifeTr: ['Büyük orfozlar', 'Balık sürüleri', 'Tropik resif balıkları', 'Mercan gelişimi'],
    currentNotesTr: 'Akıntı ve görüş değişkendir; üstyapı tek bir dalış sırasında bile görüşten kaybolabilir.',
    experienceNotesTr: 'Başlangıç dalışı değildir; ileri seviye yeterlilik veya eşdeğer deneyim, penetrasyon için ayrıca kapalı ortam eğitimi gerekir.',
    historyTr: '1956–1989 arasında hizmet verdi, 2002’de Key Largo açıklarında batırıldı ve 2005’te Dennis Kasırgası ile dik konuma geldi.',
  },
  'Vandenberg Wreck': {
    summaryTr: 'Key West’in güneyinde yapay resif olarak batırılmış 160 metrelik eski füze takip gemisi.',
    descriptionTr: 'Gemi yaklaşık 46 metre derinlikte dik durur; kısaltılan üstyapıları yüzeyden yaklaşık 12–14 metre aşağıdadır.',
    highlightsTr: ['Eski takip antenleri ve üstyapı', 'Geniş, dalışa hazırlanmış batık'],
    experienceNotesTr: 'Uygun eğitim ve deneyime sahip dalgıçlar için derin bir batıktır.',
    historyTr: 'Eski askerî nakliye ve Soğuk Savaş füze takip gemisi temizlenerek 27 Mayıs 2009’da batırıldı.',
  },
  'Western Sambo': {
    summaryTr: 'Klasik mahmuz-oluk oluşumlarına sahip koruma altındaki Key West resifi.',
    descriptionTr: 'Resif çok sığ sudan yaklaşık 9 metreye uzanır; zengin mercan ve deniz yaşamı barındırır.',
    marineLifeTr: ['Köpekbalıkları', 'Deniz kaplumbağaları', 'Vatozlar', 'Resif balıkları'],
  },
  'Conch Reef Wall': {
    summaryTr: 'Conch Reef’in Florida Keys’te iyi gelişmiş duvar yapısı sunan daha derin kenarı.',
    descriptionTr: 'NOAA kaynakları Conch Reef’i kademeli yapıya ve belirgin bir resif duvarına sahip olarak tanımlar; duvar noktası koruma alanı şamandıra sisteminde listelenir.',
  },
  "Joe's Tug Wreck": {
    summaryTr: 'Key West açıklarında yapay resif olarak kullanılan 27 metrelik çelik römorkör batığı.',
    descriptionTr: 'Florida Balık ve Yaban Hayatı Koruma Komisyonu, Joe’s Tug’ı yaklaşık 20 metre derinlikte bir yapay resif olarak listeler.',
  },
  'Toppinos Marker': {
    summaryTr: 'Toppino’s Reef veya Marker Reef #1 olarak da bilinen sığ Key West resifi.',
    descriptionTr: 'Yaklaşık 8 metre azami derinlikteki resifte uzun mercan parmakları, mahmuz-oluk yapıları ve üç bağlama şamandırası bulunur.',
    highlightsTr: ['Uzun mercan parmakları', 'Mahmuz-oluk yapıları', 'Üç bağlama şamandırası'],
    marineLifeTr: ['Homurtu balıkları', 'Sarı kuyruklu lutjanlar', 'Kelebek balıkları', 'Papağan balıkları', 'Tang balıkları'],
    experienceNotesTr: 'Sığ dalış ve şnorkel için uygundur; gece dalışında da kullanılır.',
  },
}

const genericSummaryTr = 'Florida Keys Ulusal Deniz Koruma Alanı içindeki adlandırılmış bir resif veya batık noktası.'
const spaDescriptionTr = 'NOAA bu adlandırılmış resifi, dalış ve şnorkele izin verilen bir Koruma Alanı içinde listeler; bağlama şamandıraları demir hasarını azaltmaya yardımcı olur.'
const mooringDescriptionTr = 'NOAA bu adlandırılmış noktayı, demir atmadan resif veya batık erişimi sağlayan Florida Keys Ulusal Deniz Koruma Alanı bağlama şamandırası ağında listeler.'

export function localizedSiteFields(site: DiveSiteEnrichment): SiteLocalizedFields {
  const tr = siteCopyTr[site.siteName] ?? {}
  const descriptionTr =
    tr.descriptionTr ??
    (site.description === 'NOAA identifies this named reef within a Sanctuary Preservation Area, where diving and snorkeling are allowed and mooring buoys help prevent anchor damage.'
      ? spaDescriptionTr
      : site.description === 'NOAA lists this named location in the Florida Keys National Marine Sanctuary mooring-buoy network used to support reef or wreck access without anchoring.'
        ? mooringDescriptionTr
        : null)

  return {
    summaryEn: site.summary,
    summaryTr:
      tr.summaryTr ??
      (site.summary === 'Named Florida Keys National Marine Sanctuary reef or wreck location.'
        ? genericSummaryTr
        : null),
    descriptionEn: site.description,
    descriptionTr,
    highlightsEn: site.highlights,
    highlightsTr: tr.highlightsTr ?? [],
    marineLifeEn: site.marineLife,
    marineLifeTr: tr.marineLifeTr ?? [],
    visibilityEn: site.visibility,
    visibilityTr: tr.visibilityTr ?? null,
    currentNotesEn: site.currentNotes,
    currentNotesTr: tr.currentNotesTr ?? null,
    experienceNotesEn: site.experienceNotes,
    experienceNotesTr: tr.experienceNotesTr ?? null,
    historyEn: site.history,
    historyTr: tr.historyTr ?? null,
  }
}

const centerDescriptionTr: Record<number, string> = {
  2: 'Key Largo’da resif ve batık dalışları, şnorkel, dalgıç eğitimi, ekipman kiralama ve özel tekne turları sunan dalış işletmesi.',
  3: 'Ekipman satışı, bakımı, kiralama ve dalgıç eğitimi sunan Key Largo dalış mağazası.',
  5: 'Key Largo ve Islamorada resifleri ile batıklarına rehberli geziler ve dalgıç eğitimi sunan Tavernier işletmesi.',
  6: 'Upper Keys’te günlük resif ve batık dalışları, eğitim, ekipman satışı ve kiralama hizmetleri sunan işletme.',
  7: 'Dalış ve şnorkel gezileri, eğitim, ekipman ve tekne kiralama hizmetleri sunan Marathon marina ve dalış merkezi.',
  8: 'Looe Key gezileri, dalgıç eğitimi ve ekipman kiralama sunan Lower Keys tatil tesisi ve dalış merkezi.',
  9: 'Resif dalışı, şnorkel, eğitim ve ekipman kiralama sunan aile işletmesi Marathon dalış merkezi.',
  10: 'Scuba, şnorkel, serbest dalış ve zıpkınla balıkçılık ekipmanları sunan Key West mağazası.',
  11: 'Ekipman satışı, onarımı, bakımı ve kiralama hizmetleri sunan Key Largo dalış mağazası.',
  16: 'Florida Balık ve Yaban Hayatı Koruma Komisyonu belgelerinde yer alan Cudjoe Key marina ve tekne rampası tesisi.',
  17: 'Dalış ve şnorkel gezileri, eğitim, perakende ekipman ve kiralama sunan Key West dalış merkezi.',
  20: 'Resif ve batık gezileri, dalgıç eğitimi, kiralama, hava ve nitroks dolumu sunan Key West PADI dalış merkezi.',
  21: 'Sığ resif noktalarına rehberli şnorkel gezilerinde uzmanlaşan Key Largo işletmesi.',
  22: 'Rehberli resif ve batık gezileri, dalgıç eğitimi, özel tekne turları ve ekipman kiralama sunan Islamorada işletmesi.',
  23: 'Scuba ve şnorkel gezileri, eğitim, ekipman kiralama ve özel tekne turları sunan Key Largo PADI dalış merkezi.',
}

const centerTermTr: Record<string, string> = {
  'Scuba diving trips': 'Scuba dalış gezileri',
  'Snorkeling trips': 'Şnorkel gezileri',
  'Private charters': 'Özel tekne turları',
  'Dive equipment sales': 'Dalış ekipmanı satışı',
  'Equipment service': 'Ekipman bakımı',
  'Guided scuba diving': 'Rehberli scuba dalışı',
  Snorkeling: 'Şnorkel',
  'Marina services': 'Marina hizmetleri',
  'Boat rental': 'Tekne kiralama',
  'Resort accommodation': 'Tatil tesisi konaklaması',
  'Dive and watersports equipment sales': 'Dalış ve su sporları ekipmanı satışı',
  'Equipment repair and maintenance': 'Ekipman onarım ve bakımı',
  Marina: 'Marina',
  'Boat ramp': 'Tekne rampası',
  'Air and nitrox fills': 'Hava ve nitroks dolumu',
  'Recreational scuba courses': 'Rekreasyonel scuba kursları',
  'Scuba training': 'Scuba eğitimi',
  'Recreational and professional scuba courses': 'Rekreasyonel ve profesyonel scuba kursları',
  'Key Largo reef and wreck trips': 'Key Largo resif ve batık gezileri',
  'Key Largo and Islamorada reef and wreck trips': 'Key Largo ve Islamorada resif ve batık gezileri',
  'Upper Keys reef and wreck trips': 'Upper Keys resif ve batık gezileri',
  'Marathon reef and wreck trips': 'Marathon resif ve batık gezileri',
  'Looe Key Reef trips': 'Looe Key Resifi gezileri',
  'Marathon reef trips': 'Marathon resif gezileri',
  'Key West reef and wreck trips': 'Key West resif ve batık gezileri',
  'Key Largo snorkeling trips': 'Key Largo şnorkel gezileri',
  'Islamorada reef and wreck trips': 'Islamorada resif ve batık gezileri',
  'Scuba equipment rental': 'Scuba ekipmanı kiralama',
  'Scuba and snorkeling equipment rental': 'Scuba ve şnorkel ekipmanı kiralama',
  'Snorkeling equipment included with trips': 'Şnorkel ekipmanı geziye dâhildir',
}

const localizeTerms = (items: string[]) =>
  items.map((item) => centerTermTr[item]).filter((item): item is string => Boolean(item))

export function localizedCenterFields(center: DiveCenterEnrichment): CenterLocalizedFields {
  return {
    descriptionEn: center.description,
    descriptionTr: centerDescriptionTr[center.recordId] ?? null,
    openingHoursEn: center.openingHours,
    openingHoursTr: center.openingHours?.replace(/^Daily /, 'Her gün ') ?? null,
    servicesEn: center.services,
    servicesTr: localizeTerms(center.services),
    coursesEn: center.courses,
    coursesTr: localizeTerms(center.courses),
    boatTripsEn: center.boatTrips,
    boatTripsTr: localizeTerms(center.boatTrips),
    rentalsEn: center.rentals,
    rentalsTr: localizeTerms(center.rentals),
  }
}
