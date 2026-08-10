export type Cta = { label: string; href: string };
export type NavItem = { label: string; href: string };
export type HeroSlide = { src: string; alt: string };

export type HeroContent = {
  eyebrow: string;
  headline: string[];
  support: string;
  meta: string;
  primaryCta: Cta;
  secondaryCta: Cta;
  slides: HeroSlide[];
};

export type FacilityIcon = "kitchen" | "parking" | "accessibility" | "outdoor";

export type UtleieContent = {
  id: string;
  eyebrow: string;
  title: string;
  lead: string;
  body: string;
  capacity: { value: number; unit: string; label: string };
  facilities: { icon: FacilityIcon; label: string }[];
  uses: string[];
  equipment: string[];
  image: string;
  imageAlt: string;
  gallery: { src: string; alt: string; caption: string }[];
};

export type CabinFeatureIcon = "living" | "kitchen" | "storage" | "compost" | "loft" | "winter";

/** A drawing an architect made, published as a downloadable PDF. */
export type ArchitectDocument = {
  label: string;
  /** Path to the PDF under /public. */
  url: string;
  /** Rendered page from the PDF, shown as the card preview. */
  preview: string;
  previewAlt: string;
};

export type Architect = {
  name: string;
  role: string;
  document?: ArchitectDocument;
};

export type ParselleneContent = {
  id: string;
  eyebrow: string;
  title: string;
  lead: string;
  body: string;
  details: string;
  stats: { value: number; unit: string; label: string }[];
  cabin: { title: string; features: { icon: CabinFeatureIcon; label: string }[] };
  board: { title: string; body: string; tasks: string[]; email: string };
  architects: { title: string; people: Architect[] };
  image: string;
  imageAlt: string;
  gallery: { src: string; alt: string; caption: string }[];
  waitlist: {
    title: string;
    body: string;
    facebookUrl: string;
    facebookLabel: string;
    contactName: string;
    email: string;
  };
};

export type LocationPlaceIcon = "beach" | "harbour" | "trail" | "dunes" | "forest" | "museum";

/** A sight or activity within easy reach of the gardens. */
export type LocationPlace = {
  icon: LocationPlaceIcon;
  name: string;
  distance: string;
  description: string;
};

/** A visitor review, quoted verbatim from Google Maps. */
export type LocationReview = {
  quote: string;
  name: string;
  rating: number;
};

export type LocationContent = {
  id: string;
  eyebrow: string;
  title: string;
  body: string;
  address: string[];
  mapUrl: string;
  directionsUrl: string;
  coords: { lat: number; lng: number };
  places: { eyebrow: string; title: string; items: LocationPlace[] };
  reviews: {
    eyebrow: string;
    title: string;
    rating: number;
    count: number;
    quotes: LocationReview[];
  };
};

export type ContactContent = {
  booking: { name: string; email: string; phone: string };
  plots: { name: string; email: string };
};

export type SiteContent = {
  name: string;
  tagline: string;
  logo: string;
  nav: NavItem[];
  hero: HeroContent;
  utleie: UtleieContent;
  parsellene: ParselleneContent;
  location: LocationContent;
  contact: ContactContent;
  footer: { copyright: string };
};

export const site: SiteContent = {
  name: "Ølberg strandhager",
  tagline: "der hagen møter havet",
  logo: "/images/logo.png",
  nav: [
    { label: "Utleie", href: "#utleie" },
    { label: "Parsellene", href: "#parsellene" },
    { label: "Hvor er vi?", href: "#hvor-er-vi" },
  ],
  hero: {
    eyebrow: "Ølberg strandhager",
    headline: ["der hagen", "møter havet"],
    support:
      "47 parseller med egne hytter, og et felleshus til kurs og feiring – rett ved Solastranden.",
    meta: "Solastranden · Sola · Rogaland",
    primaryCta: { label: "Book Felleshuset", href: "#booking" },
    secondaryCta: { label: "Finn oss", href: "#hvor-er-vi" },
    slides: [
      {
        src: "/images/hero-felleshus-1.png",
        alt: "Felleshuset ved Ølberg strandhager med utsikt mot havet",
      },
      {
        src: "/images/felleshuset.jpg",
        alt: "Felleshuset og parsellhyttene omgitt av blomstrende lyng",
      },
      {
        src: "/images/hero-garden.png",
        alt: "Parsellhagene ved Solastranden sett fra luften",
      },
      {
        src: "/images/hero-felleshus-2.png",
        alt: "Uteområdet ved Felleshuset",
      }
    ],
  },
  utleie: {
    id: "utleie",
    eyebrow: "Utleie",
    title: "Kurs, konferanser og samlinger",
    lead: "Et moderne selskapslokale i utkanten av parsellhage-området, med fri sikt ut over havet og Solastranden – og kort vei fra Stavanger lufthavn, Sola.",
    body: "Felleshuset til Ølberg Strandhager har moderne lokaler til leie med plass til inntil 50 personer. Romslige fellesarealer rundt huset gir god anledning til uteaktiviteter – kombiner gjerne kurs og teambuilding med en tur på stranden.",
    capacity: { value: 50, unit: "personer", label: "Plass i selskapslokalet" },
    facilities: [
      { icon: "kitchen", label: "Storkjøkken" },
      { icon: "parking", label: "Gode parkeringsmuligheter" },
      { icon: "accessibility", label: "Universell utforming" },
      { icon: "outdoor", label: "Romslige uteareal" },
    ],
    uses: [
      "Kurs og teambuilding",
      "Lag og organisasjoner",
      "Dåp, konfirmasjon og bryllup",
      "Jubileer og minnestunder",
    ],
    equipment: [
      "Projektor og lerret",
      "Stoler og bord til 50 personer",
      "Komfyr, oppvaskmaskin og fryseboks",
      "Dekketøy og servering til 50 personer",
    ],
    image: "/images/utleie-konferanse.jpg",
    imageAlt: "Selskapslokalet dekket til kurs med panoramautsikt mot havet",
    gallery: [
      {
        src: "/images/utleie-langbord.jpg",
        alt: "Langbord dekket til fest i selskapslokalet",
        caption: "Selskapslokalet dekket til fest",
      },
      {
        src: "/images/utleie-terrasse-selskap.jpg",
        alt: "Gjester samlet rundt bordet på terrassen",
        caption: "Samling på terrassen",
      },
      {
        src: "/images/utleie-terrasse.jpg",
        alt: "Terrassen med bord og stoler og utsikt mot havet",
        caption: "Uteservering med havutsikt",
      },
      {
        src: "/images/utleie-peisestue.jpg",
        alt: "Peisestuen i Felleshuset med store vinduer",
        caption: "Peisestuen",
      },
      {
        src: "/images/utleie-storkjokken.jpg",
        alt: "Storkjøkkenet i Felleshuset",
        caption: "Storkjøkkenet",
      },
      {
        src: "/images/utleie-borddekking.jpg",
        alt: "Nærbilde av dekket bord med blomster og glass",
        caption: "Klart til servering",
      },
      {
        src: "/images/utleie-utsikt.jpg",
        alt: "Utsikt fra Ølberg strandhager mot Solastranden",
        caption: "Utsikten mot Solastranden",
      },
    ],
  },
  parsellene: {
    id: "parsellene",
    eyebrow: "Parsellene",
    title: "47 ovale hager mot havet",
    lead: "Egen hage, egen hytte og havet som nabo – i et fellesskap som dyrker sammen året rundt.",
    body: "De 47 parsellene har oval form og er på 300 m², hver med en hytte på 30 m². Hyttene inneholder oppholdsrom med kjøkkenkrok, bod og biodo samt hems. De er vinterisolerte og gir anledning til bruk hele året.",
    details:
      "På parsellene dyrkes det frukt, bær og grønnsaker i et unikt miljø. Her vil du oppleve at årstidene veksler med spiring, blomstring og innhøsting. Området grenser til friområdet ved Solastranden og har mange fine tur- og bademuligheter.",
    stats: [
      { value: 47, unit: "stk", label: "Parseller" },
      { value: 300, unit: "m²", label: "Hage per parsell" },
      { value: 30, unit: "m²", label: "Hytte per parsell" },
      { value: 12, unit: "mnd", label: "Vinterisolert for bruk hele året" },
    ],
    cabin: {
      title: "I hver hytte",
      features: [
        { icon: "living", label: "Oppholdsrom" },
        { icon: "kitchen", label: "Kjøkkenkrok" },
        { icon: "storage", label: "Bod" },
        { icon: "compost", label: "Biodo" },
        { icon: "loft", label: "Hems" },
        { icon: "winter", label: "Vinterisolert" },
      ],
    },
    board: {
      title: "Hagestyret",
      body: "Parsellantene velger et hagestyre som representerer leietakerne.",
      tasks: [
        "Ivareta leietakernes felles interesser i samarbeidet med grunneier og utleier",
        "Arbeide for å fremme trivsel og fellesskap i strandhagen",
      ],
      email: "hagestyret@strandhager.no",
    },
    architects: {
      title: "Tegninger og planer",
      people: [
        {
          name: "Ida Helen Tørud",
          role: "Landskapsarkitekt – illustrasjonsplan",
          document: {
            label: "Illustrasjonsplan",
            url: "/dokumenter/illustrasjonsplan.pdf",
            preview: "/images/tegninger/illustrasjonsplan.webp",
            previewAlt:
              "Illustrasjonsplan som viser de 47 ovale parsellene, felleshuset og parkeringen ved Ølberg strandhager",
          },
        },
        {
          name: "Edward Andersen",
          role: "Arkitekt – hytter og felleshus",
          document: {
            label: "Hyttetegninger",
            url: "/dokumenter/hyttetegninger.pdf",
            preview: "/images/tegninger/hyttetegninger-1.png",
            previewAlt:
              "Fasade- og gavltegninger av parsellhytte A slik arkitekten tegnet dem i 2003",
          },
        },
      ],
    },
    image: "/images/parsellene/parsellene-01.jpg",
    imageAlt: "Parsellhagene i høstfarger ved Ølberg strandhager",
    gallery: [
      {
        src: "/images/parsellene/parsellene-03.jpg",
        alt: "Strandhagen sett over parsellene mot boligfeltet",
        caption: "Strandhagen sett over parsellene",
      },
      {
        src: "/images/parsellene/parsellene-12.jpg",
        alt: "Gangvei mellom parsellhyttene i kveldslys",
        caption: "Gangveien mellom hyttene i kveldslys",
      },
      {
        src: "/images/parsellene/parsellene-14.jpg",
        alt: "Grønnsaksbed og drivhus på en parsell",
        caption: "Grønnsaksbed og drivhus",
      },
      {
        src: "/images/parsellene/parsellene-16.jpg",
        alt: "Røde blomster som klatrer over en pergola",
        caption: "Blomstring over pergolaen",
      },
      {
        src: "/images/parsellene/parsellene-20.jpg",
        alt: "Høybed med grønnsaker på en parsell",
        caption: "Høybed med sommerens avling",
      },
      {
        src: "/images/parsellene/parsellene-07.jpg",
        alt: "Person på vei gjennom en blomstrende hagegang",
        caption: "Innhøsting i strandhagen",
      },
      {
        src: "/images/parsellene/parsellene-23.jpg",
        alt: "Parsellhage i full blomst en sommerdag",
        caption: "Hagen i full blomst",
      },
      {
        src: "/images/parsellene/parsellene-25.jpg",
        alt: "Solnedgang over parsellhyttene",
        caption: "Solnedgang over hyttene",
      },
    ],
    waitlist: {
      title: "Vil du ha en parsell?",
      body: "Ønsker du å stå på venteliste og få informasjon når det blir ledig parsell? Bli medlem av Facebook-gruppa, eller ta kontakt direkte.",
      facebookUrl: "https://www.facebook.com/groups/820245121802789/",
      facebookLabel: "Bli med i Facebook-gruppa",
      contactName: "Philip Ølberg",
      email: "philip@strandhager.no",
    },
  },
  location: {
    id: "hvor-er-vi",
    eyebrow: "Hvor er vi?",
    title: "Ved Solastranden i Sola",
    body: "Ølberg strandhager ligger helt i strandkanten ved Solastranden i Sola kommune, Rogaland – ti minutter fra Stavanger lufthavn og en halvtime fra Stavanger sentrum.",
    address: ["Ølberg strandhager", "Strandhagane 50", "4053 Ræge"],
    mapUrl:
      "https://www.google.com/maps?q=%C3%98lberg+Strandhager,+%C3%98lbergvegen,+R%C3%A6ge,+Norge",
    directionsUrl:
      "https://www.google.com/maps/dir/?api=1&destination=%C3%98lberg+Strandhager,+Strandhagane+50,+4053+R%C3%A6ge",
    coords: { lat: 58.874869, lng: 5.588566 },
    places: {
      eyebrow: "Opplev området",
      title: "Perler i nabolaget",
      items: [
        {
          icon: "harbour",
          name: "Ølbergstranden og havnen",
          distance: "5 min til fots",
          description:
            "Lun, langgrunn sandstrand rett ved hagene, og en levende fiskehavn der båtene fortsatt lander dagens fangst. Ølberg-kiosken er kjent for regionens beste softis.",
        },
        {
          icon: "beach",
          name: "Solastranden",
          distance: "5 min med bil",
          description:
            "2,3 kilometer med hvit sandstrand, kåret av Sunday Times til en av verdens fineste. Populær blant surfere, badegjester og turgåere hele året.",
        },
        {
          icon: "trail",
          name: "Kyststien mot Vigdel",
          distance: "Rett fra hagene",
          description:
            "Merket kyststi gjennom beitelandskap, svaberg og klipper til idylliske Vigdelstranden. Ta turen opp på Vigdelsveten for utsikt over hele kysten.",
        },
        {
          icon: "dunes",
          name: "Hellestøstranden",
          distance: "10 min med bil",
          description:
            "Vid strand med sanddyner av nasjonal verneverdi, og et av få steder på Jæren der kiting er tillatt. Flott for lange strandturer i all slags vær.",
        },
        {
          icon: "forest",
          name: "Ølbergskogen",
          distance: "5 min til fots",
          description:
            "Frodig turskog rett bak havnen, med stier mellom trærne og fredede krigsminner fra andre verdenskrig å utforske for store og små.",
        },
        {
          icon: "museum",
          name: "Flyhistorisk Museum Sola",
          distance: "10 min med bil",
          description:
            "En imponerende samling fly og helikoptre ved Stavanger lufthavn – en severdighet for hele familien på en regnværsdag.",
        },
      ],
    },
    reviews: {
      eyebrow: "Hva folk sier",
      title: "Anbefalt av besøkende",
      rating: 4.6,
      count: 76,
      quotes: [
        {
          quote:
            "Vel organisert. Tomtene var runde. Det var en flott løsning. Fint opparbeidet. Mye spennende vekster og trær. Heldige de som har fått plass der.",
          name: "Sissel Nedrehagen",
          rating: 5,
        },
        {
          quote:
            "Fantastisk utsikt. Flott og praktisk lokale til alle typer feiringer. Godt utstyrt kjøkken. Stor parkering.",
          name: "Anna Frantzen",
          rating: 5,
        },
        {
          quote: "Ekstremt fine hager og hyggelig folk! Verdt å ta en titt på!",
          name: "Bo Welander",
          rating: 5,
        },
      ],
    },
  },
  contact: {
    booking: {
      name: "Sigbjørn Ølberg",
      email: "sioel@online.no",
      phone: "957 82 508",
    },
    plots: {
      name: "Philip Ølberg",
      email: "philip@strandhager.no",
    },
  },
  footer: {
    copyright: `© ${new Date().getFullYear()} Ølberg strandhager`,
  },
};
