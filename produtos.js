const WHATSAPP = "5561999291377";

// TEMPORÁRIO: R$ 0,10 em todos os itens para teste live. Restaurar preços de produção depois.

const PRODUCTS = [
  {
    "id": "neurocodigos",
    "name": "NeuroCódigos",
    "category": "mente",
    "volume": "60ml",
    "price": 0.1,
    "image": "assets/img/prod-neurocodigos.jpg",
    "audio": "assets/audio/neurocodigos.mp3",
    "tagline": "Conexão entre neurônios para cognição e foco",
    "description": "Desenvolvido para potencializar as conexões neurais, estimular processos cognitivos e promover maior clareza mental. Sua frequência ajuda a organizar pensamentos, concentração e o foco no dia a dia.",
    "indications": [
      "Estimula a conexão neural e a plasticidade cerebral",
      "Favorece memória e cognição",
      "Melhora a atenção e o foco em tarefas importantes",
      "Apoia estados de clareza mental e produtividade"
    ],
    "i18n": {
      "pt": {
        "tagline": "Conexão entre neurônios para cognição e foco",
        "description": "Desenvolvido para potencializar as conexões neurais, estimular processos cognitivos e promover maior clareza mental. Sua frequência ajuda a organizar pensamentos, concentração e o foco no dia a dia.",
        "indications": [
          "Estimula a conexão neural e a plasticidade cerebral",
          "Favorece memória e cognição",
          "Melhora a atenção e o foco em tarefas importantes",
          "Apoia estados de clareza mental e produtividade"
        ]
      },
      "en": {
        "tagline": "Neuron connection for cognition and focus",
        "description": "Designed to strengthen neural connections, stimulate cognitive processes and promote greater mental clarity. Its frequency helps organize thoughts, concentration and daily focus.",
        "indications": [
          "Stimulates neural connection and brain plasticity",
          "Supports memory and cognition",
          "Improves attention and focus on important tasks",
          "Supports mental clarity and productivity"
        ]
      },
      "de": {
        "tagline": "Neuronale Verbindung für Kognition und Fokus",
        "description": "Entwickelt, um neuronale Verbindungen zu stärken, kognitive Prozesse anzuregen und mentale Klarheit zu fördern. Die Frequenz hilft, Gedanken, Konzentration und den Fokus im Alltag zu ordnen.",
        "indications": [
          "Fördert neuronale Verbindung und Gehirnplastizität",
          "Unterstützt Gedächtnis und Kognition",
          "Verbessert Aufmerksamkeit und Fokus bei wichtigen Aufgaben",
          "Unterstützt mentale Klarheit und Produktivität"
        ]
      },
      "es": {
        "tagline": "Conexión entre neuronas para cognición y enfoque",
        "description": "Desarrollado para potenciar las conexiones neurales, estimular procesos cognitivos y promover mayor claridad mental. Su frecuencia ayuda a organizar pensamientos, concentración y el enfoque en el día a día.",
        "indications": [
          "Estimula la conexión neural y la plasticidad cerebral",
          "Favorece la memoria y la cognición",
          "Mejora la atención y el enfoque en tareas importantes",
          "Apoya estados de claridad mental y productividad"
        ]
      },
      "fr": {
        "tagline": "Connexion entre neurones pour la cognition et le focus",
        "description": "Conçu pour renforcer les connexions neurales, stimuler les processus cognitifs et favoriser une plus grande clarté mentale. Sa fréquence aide à organiser les pensées, la concentration et le focus au quotidien.",
        "indications": [
          "Stimule la connexion neurale et la plasticité cérébrale",
          "Favorise la mémoire et la cognition",
          "Améliore l’attention et le focus sur les tâches importantes",
          "Soutient la clarté mentale et la productivité"
        ]
      }
    }
  },
  {
    "id": "bioverbum",
    "name": "BioVerbum",
    "category": "comunicacao",
    "volume": "60ml",
    "price": 0.1,
    "image": "assets/img/prod-bioverbum.jpg",
    "audio": "assets/audio/bioverbum.mp3",
    "tagline": "Frequência do Falar | Clareza de comunicação",
    "description": "Estimula a expressão verbal e desbloqueia a comunicação, trazendo clareza e fluidez ao falar. Atua na verbalização, ajudando a transformar pensamentos em palavras com naturalidade e confiança.",
    "indications": [
      "Estimula a clareza de comunicação",
      "Facilita a expressão verbal em diferentes contextos",
      "Auxilia no desbloqueio de travas emocionais relacionadas ao falar",
      "Promove segurança e confiança ao se expressar"
    ],
    "i18n": {
      "pt": {
        "tagline": "Frequência do Falar | Clareza de comunicação",
        "description": "Estimula a expressão verbal e desbloqueia a comunicação, trazendo clareza e fluidez ao falar. Atua na verbalização, ajudando a transformar pensamentos em palavras com naturalidade e confiança.",
        "indications": [
          "Estimula a clareza de comunicação",
          "Facilita a expressão verbal em diferentes contextos",
          "Auxilia no desbloqueio de travas emocionais relacionadas ao falar",
          "Promove segurança e confiança ao se expressar"
        ]
      },
      "en": {
        "tagline": "Frequency of speaking | Communication clarity",
        "description": "Stimulates verbal expression and unlocks communication, bringing clarity and fluency when speaking. It supports verbalization, helping turn thoughts into words with natural ease and confidence.",
        "indications": [
          "Supports clearer communication",
          "Facilitates verbal expression in different contexts",
          "Helps release emotional blocks related to speaking",
          "Promotes confidence when expressing yourself"
        ]
      },
      "de": {
        "tagline": "Frequenz des Sprechens | Klarheit in der Kommunikation",
        "description": "Anregt den verbalen Ausdruck und öffnet die Kommunikation – mit Klarheit und Fluss beim Sprechen. Unterstützt die Verbalisierung und hilft, Gedanken natürlich und selbstsicher in Worte zu verwandeln.",
        "indications": [
          "Fördert Klarheit in der Kommunikation",
          "Erleichtert den verbalen Ausdruck in verschiedenen Kontexten",
          "Hilft, emotionale Blockaden beim Sprechen zu lösen",
          "Stärkt Sicherheit und Vertrauen beim Ausdrücken"
        ]
      },
      "es": {
        "tagline": "Frecuencia del Hablar | Claridad de comunicación",
        "description": "Estimula la expresión verbal y desbloquea la comunicación, aportando claridad y fluidez al hablar. Actúa en la verbalización, ayudando a transformar pensamientos en palabras con naturalidad y confianza.",
        "indications": [
          "Estimula la claridad de comunicación",
          "Facilita la expresión verbal en diferentes contextos",
          "Ayuda a desbloquear bloqueos emocionales relacionados con el hablar",
          "Promueve seguridad y confianza al expresarse"
        ]
      },
      "fr": {
        "tagline": "Fréquence de la parole | Clarté de communication",
        "description": "Stimule l’expression verbale et débloque la communication, apportant clarté et fluidité à la parole. Agit sur la verbalisation, aidant à transformer les pensées en mots avec naturel et confiance.",
        "indications": [
          "Soutient une communication plus claire",
          "Facilite l’expression verbale dans différents contextes",
          "Aide à libérer les blocages émotionnels liés à la parole",
          "Favorise la sécurité et la confiance en s’exprimant"
        ]
      }
    }
  },
  {
    "id": "sono-de-luz",
    "name": "Sono de Luz",
    "category": "sensorial",
    "volume": "60ml",
    "price": 0.1,
    "image": "assets/img/prod-sono-de-luz.jpg",
    "audio": "assets/audio/sono-de-luz.mp3",
    "tagline": "Equilíbrio do sono e descanso profundo restaurador",
    "description": "Promove o equilíbrio natural do sono, favorecendo um descanso profundo e restaurador. Sua frequência atua no relaxamento físico e mental, reduzindo agitação e favorecendo noites reparadoras.",
    "indications": [
      "Regula o ciclo natural do sono",
      "Favorece relaxamento profundo",
      "Melhora a qualidade do descanso ao acordar",
      "Apoia a restauração física e mental"
    ],
    "i18n": {
      "pt": {
        "tagline": "Equilíbrio do sono e descanso profundo restaurador",
        "description": "Promove o equilíbrio natural do sono, favorecendo um descanso profundo e restaurador. Sua frequência atua no relaxamento físico e mental, reduzindo agitação e favorecendo noites reparadoras.",
        "indications": [
          "Regula o ciclo natural do sono",
          "Favorece relaxamento profundo",
          "Melhora a qualidade do descanso ao acordar",
          "Apoia a restauração física e mental"
        ]
      },
      "en": {
        "tagline": "Sleep balance and deep restorative rest",
        "description": "Promotes natural sleep balance, favoring deep restorative rest. Its frequency supports physical and mental relaxation, reducing agitation and favoring restorative nights.",
        "indications": [
          "Supports the natural sleep cycle",
          "Favors deep relaxation",
          "Improves rest quality upon waking",
          "Supports physical and mental restoration"
        ]
      },
      "de": {
        "tagline": "Schlafbalance und tiefe regenerative Ruhe",
        "description": "Fördert das natürliche Schlafleichgewicht und begünstigt tiefe, regenerative Ruhe. Die Frequenz wirkt auf körperliche und mentale Entspannung, reduziert Unruhe und unterstützt erholsame Nächte.",
        "indications": [
          "Unterstützt den natürlichen Schlafzyklus",
          "Fördert tiefe Entspannung",
          "Verbessert die Erholungsqualität beim Aufwachen",
          "Unterstützt körperliche und mentale Regeneration"
        ]
      },
      "es": {
        "tagline": "Equilibrio del sueño y descanso profundo restaurador",
        "description": "Promueve el equilibrio natural del sueño, favoreciendo un descanso profundo y restaurador. Su frecuencia actúa en la relajación física y mental, reduciendo la agitación y favoreciendo noches reparadoras.",
        "indications": [
          "Regula el ciclo natural del sueño",
          "Favorece la relajación profunda",
          "Mejora la calidad del descanso al despertar",
          "Apoya la restauración física y mental"
        ]
      },
      "fr": {
        "tagline": "Équilibre du sommeil et repos réparateur profond",
        "description": "Favorise l’équilibre naturel du sommeil et un repos réparateur profond. Sa fréquence soutient la relaxation physique et mentale pour des nuits plus légères et restauratrices.",
        "indications": [
          "Favorise un sommeil plus réparateur",
          "Soutient la relaxation physique et mentale",
          "Aide à l’équilibre du rythme de sommeil",
          "Complète le soin avec la Méthode CEME"
        ]
      }
    }
  },
  {
    "id": "socializacao",
    "name": "Socialização",
    "category": "comunicacao",
    "volume": "60ml",
    "price": 0.1,
    "image": "assets/img/prod-socializacao.jpg",
    "audio": "assets/audio/socializacao.mp3",
    "tagline": "Integração social | Flexibilidade | Bem-estar integral",
    "description": "Fórmula exclusiva que atua nos quatro corpos — físico, mental, emocional e energético — para estimular flexibilidade e integração social, com mais leveza na convivência.",
    "indications": [
      "Mantém a saúde física, mental, emocional e energética",
      "Previne rigidez física, emocional, mental e espiritual",
      "Aumenta o limiar de frustração e a mobilidade interna",
      "Favorece a convivência social com leveza"
    ],
    "i18n": {
      "pt": {
        "tagline": "Integração social | Flexibilidade | Bem-estar integral",
        "description": "Fórmula exclusiva que atua nos quatro corpos — físico, mental, emocional e energético — para estimular flexibilidade e integração social, com mais leveza na convivência.",
        "indications": [
          "Mantém a saúde física, mental, emocional e energética",
          "Previne rigidez física, emocional, mental e espiritual",
          "Aumenta o limiar de frustração e a mobilidade interna",
          "Favorece a convivência social com leveza"
        ]
      },
      "en": {
        "tagline": "Social integration | Flexibility | Integral wellbeing",
        "description": "Exclusive formula that works on the four bodies — physical, mental, emotional and energetic — to stimulate flexibility and social integration, with more ease in relating to others.",
        "indications": [
          "Supports physical, mental, emotional and energetic health",
          "Helps prevent physical, emotional, mental and spiritual rigidity",
          "Raises frustration tolerance and inner mobility",
          "Favors lighter social coexistence"
        ]
      },
      "de": {
        "tagline": "Soziale Integration | Flexibilität | Ganzheitliches Wohlbefinden",
        "description": "Exklusive Formel, die auf die vier Körper wirkt — physisch, mental, emotional und energetisch — um Flexibilität und soziale Integration zu fördern, mit mehr Leichtigkeit im Miteinander.",
        "indications": [
          "Unterstützt physische, mentale, emotionale und energetische Gesundheit",
          "Hilft, physische, emotionale, mentale und spirituelle Starrheit zu vermeiden",
          "Erhöht die Frustrationstoleranz und innere Beweglichkeit",
          "Fördert leichtes soziales Miteinander"
        ]
      },
      "es": {
        "tagline": "Integración social | Flexibilidad | Bienestar integral",
        "description": "Fórmula exclusiva que actúa en los cuatro cuerpos — físico, mental, emocional y energético — para estimular la flexibilidad y la integración social, con más ligereza en la convivencia.",
        "indications": [
          "Mantiene la salud física, mental, emocional y energética",
          "Previene la rigidez física, emocional, mental y espiritual",
          "Aumenta el umbral de frustración y la movilidad interna",
          "Favorece la convivencia social con ligereza"
        ]
      },
      "fr": {
        "tagline": "Intégration sociale | Flexibilité | Bien-être intégral",
        "description": "Formule exclusive qui agit sur les quatre corps — physique, mental, émotionnel et énergétique — pour stimuler l’intégration sociale, la flexibilité relationnelle et le bien-être au quotidien.",
        "indications": [
          "Favorise l’intégration sociale",
          "Soutient la flexibilité dans les relations",
          "Agit sur les quatre corps",
          "Complète le bien-être intégral"
        ]
      }
    }
  },
  {
    "id": "sensipeace",
    "name": "SensiPeace",
    "category": "sensorial",
    "volume": "60ml",
    "price": 0.1,
    "image": "assets/img/prod-sensipeace.jpg",
    "audio": "assets/audio/sensipeace.mp3",
    "tagline": "Suavização da sensibilidade ao som, luz e toque",
    "description": "Criado para auxiliar quem apresenta sensibilidade extrema a estímulos externos, como sons intensos, luzes fortes e toque físico. Promove calma, conforto e adaptação ao ambiente.",
    "indications": [
      "Suaviza a hipersensibilidade sensorial",
      "Equilibra a resposta a som, luz e toque",
      "Favorece estados de calma e acolhimento",
      "Apoia o bem-estar em sobrecarga sensorial"
    ],
    "i18n": {
      "pt": {
        "tagline": "Suavização da sensibilidade ao som, luz e toque",
        "description": "Criado para auxiliar quem apresenta sensibilidade extrema a estímulos externos, como sons intensos, luzes fortes e toque físico. Promove calma, conforto e adaptação ao ambiente.",
        "indications": [
          "Suaviza a hipersensibilidade sensorial",
          "Equilibra a resposta a som, luz e toque",
          "Favorece estados de calma e acolhimento",
          "Apoia o bem-estar em sobrecarga sensorial"
        ]
      },
      "en": {
        "tagline": "Softening sensitivity to sound, light and touch",
        "description": "Created to support those with extreme sensitivity to external stimuli such as intense sounds, strong lights and physical touch. It promotes calm, comfort and adaptation to the environment.",
        "indications": [
          "Softens sensory hypersensitivity",
          "Balances response to sound, light and touch",
          "Favors states of calm and comfort",
          "Supports wellbeing during sensory overload"
        ]
      },
      "de": {
        "tagline": "Sanfter Umgang mit Empfindlichkeit für Klang, Licht und Berührung",
        "description": "Entwickelt für Menschen mit starker Empfindlichkeit gegenüber äußeren Reizen wie intensiven Geräuschen, starkem Licht und körperlicher Berührung. Fördert Ruhe, Komfort und Anpassung an die Umgebung.",
        "indications": [
          "Mildert sensorische Überempfindlichkeit",
          "Balanceiert die Reaktion auf Klang, Licht und Berührung",
          "Fördert Zustände von Ruhe und Geborgenheit",
          "Unterstützt Wohlbefinden bei sensorischer Überlastung"
        ]
      },
      "es": {
        "tagline": "Suavización de la sensibilidad al sonido, la luz y el tacto",
        "description": "Creado para ayudar a quienes presentan sensibilidad extrema a estímulos externos, como sonidos intensos, luces fuertes y el tacto físico. Promueve calma, confort y adaptación al entorno.",
        "indications": [
          "Suaviza la hipersensibilidad sensorial",
          "Equilibra la respuesta al sonido, la luz y el tacto",
          "Favorece estados de calma y acogida",
          "Apoya el bienestar en sobrecarga sensorial"
        ]
      },
      "fr": {
        "tagline": "Adoucissement de la sensibilité au son, à la lumière et au toucher",
        "description": "Créé pour soutenir les personnes très sensibles aux stimuli externes comme les sons intenses, les lumières fortes ou le toucher, en favorisant plus de confort et de paix sensorielle.",
        "indications": [
          "Adoucit la sensibilité sensorielle",
          "Aide face aux stimuli sonores, lumineux et tactiles",
          "Favorise le confort au quotidien",
          "Soutient des états de plus grande paix intérieure"
        ]
      }
    }
  },
  {
    "id": "bioclean",
    "name": "BioClean Parasite",
    "category": "detox",
    "volume": "60ml",
    "price": 0.1,
    "image": "assets/img/prod-bioclean.jpg",
    "audio": "assets/audio/bioclean.mp3",
    "tagline": "Limpeza frequencial contra parasitas energéticos e físicos",
    "description": "Promove informação biofísica celular para neutralização e expulsão de parasitas. Fórmula exclusiva com frequências de orégano, cravo e outros ativos de vermifugação física e energética.",
    "indications": [
      "Limpeza parasitária dos corpos físico, emocional, mental e etérico",
      "Atua na limpeza e no equilíbrio do terreno biológico"
    ],
    "i18n": {
      "pt": {
        "tagline": "Limpeza frequencial contra parasitas energéticos e físicos",
        "description": "Promove informação biofísica celular para neutralização e expulsão de parasitas. Fórmula exclusiva com frequências de orégano, cravo e outros ativos de vermifugação física e energética.",
        "indications": [
          "Limpeza parasitária dos corpos físico, emocional, mental e etérico",
          "Atua na limpeza e no equilíbrio do terreno biológico"
        ]
      },
      "en": {
        "tagline": "Frequency cleansing against energetic and physical parasites",
        "description": "Promotes cellular biophysical information for neutralization and expulsion of parasites. Exclusive formula with oregano, clove and other frequencies for physical and energetic cleansing support.",
        "indications": [
          "Parasite cleansing across physical, emotional, mental and etheric bodies",
          "Supports cleansing and balance of the biological terrain"
        ]
      },
      "de": {
        "tagline": "Frequenzielle Reinigung gegen energetische und physische Parasiten",
        "description": "Fördert biophysikalische Zellinformation zur Neutralisierung und Ausscheidung von Parasiten. Exklusive Formel mit Oregano-, Nelken- und weiteren Frequenzen zur physischen und energetischen Reinigungsunterstützung.",
        "indications": [
          "Parasitäre Reinigung der physischen, emotionalen, mentalen und ätherischen Körper",
          "Unterstützt Reinigung und Balance des biologischen Terrains"
        ]
      },
      "es": {
        "tagline": "Limpieza frecuencial contra parásitos energéticos y físicos",
        "description": "Promueve información biofísica celular para la neutralización y expulsión de parásitos. Fórmula exclusiva con frecuencias de orégano, clavo y otros activos de desparasitación física y energética.",
        "indications": [
          "Limpieza parasitaria de los cuerpos físico, emocional, mental y etérico",
          "Actúa en la limpieza y el equilibrio del terreno biológico"
        ]
      },
      "fr": {
        "tagline": "Nettoyage fréquentiel contre les parasites énergétiques et physiques",
        "description": "Favorise une information biophysique cellulaire pour la neutralisation et l’expulsion des parasites. Exclusif à la ligne CEME pour un nettoyage fréquentiel du terrain.",
        "indications": [
          "Soutient le nettoyage fréquentiel",
          "Favorise la neutralisation des parasites",
          "Agit sur le terrain énergétique et physique",
          "Complète les protocoles de la Méthode CEME"
        ]
      }
    }
  },
  {
    "id": "amor-frequencial",
    "name": "Amor Frequencial",
    "category": "emocao",
    "volume": "60ml",
    "price": 0.1,
    "image": "assets/img/prod-amor-frequencial.jpg",
    "audio": "assets/audio/amor-frequencial.mp3",
    "tagline": "Presença materna | Vínculo afetivo | Amor-próprio",
    "description": "Fortalece vínculos afetivos e traz consciência de acolhimento, proteção e amor. Estimula a presença materna para relações mais saudáveis e segurança interior.",
    "indications": [
      "Reforça o sentimento de acolhimento e cuidado materno",
      "Estimula um vínculo afetivo saudável",
      "Ajuda a desenvolver amor-próprio e autoestima",
      "Promove equilíbrio emocional e segurança interna"
    ],
    "i18n": {
      "pt": {
        "tagline": "Presença materna | Vínculo afetivo | Amor-próprio",
        "description": "Fortalece vínculos afetivos e traz consciência de acolhimento, proteção e amor. Estimula a presença materna para relações mais saudáveis e segurança interior.",
        "indications": [
          "Reforça o sentimento de acolhimento e cuidado materno",
          "Estimula um vínculo afetivo saudável",
          "Ajuda a desenvolver amor-próprio e autoestima",
          "Promove equilíbrio emocional e segurança interna"
        ]
      },
      "en": {
        "tagline": "Maternal presence | Affective bond | Self-love",
        "description": "Strengthens affective bonds and brings awareness of welcome, protection and love. It stimulates maternal presence for healthier relationships and inner safety.",
        "indications": [
          "Reinforces feelings of welcome and maternal care",
          "Stimulates a healthy affective bond",
          "Helps develop self-love and self-esteem",
          "Promotes emotional balance and inner safety"
        ]
      },
      "de": {
        "tagline": "Mütterliche Präsenz | Affektive Bindung | Selbstliebe",
        "description": "Stärkt affektive Bindungen und bringt Bewusstsein für Annahme, Schutz und Liebe. Fördert mütterliche Präsenz für gesündere Beziehungen und innere Sicherheit.",
        "indications": [
          "Verstärkt das Gefühl von Annahme und mütterlicher Fürsorge",
          "Fördert eine gesunde affektive Bindung",
          "Hilft, Selbstliebe und Selbstwert zu entwickeln",
          "Fördert emotionales Gleichgewicht und innere Sicherheit"
        ]
      },
      "es": {
        "tagline": "Presencia materna | Vínculo afectivo | Amor propio",
        "description": "Fortalece vínculos afectivos y aporta conciencia de acogida, protección y amor. Estimula la presencia materna para relaciones más saludables y seguridad interior.",
        "indications": [
          "Refuerza el sentimiento de acogida y cuidado materno",
          "Estimula un vínculo afectivo saludable",
          "Ayuda a desarrollar amor propio y autoestima",
          "Promueve equilibrio emocional y seguridad interna"
        ]
      },
      "fr": {
        "tagline": "Présence maternelle | Lien affectif | Amour de soi",
        "description": "Renforce les liens affectifs et apporte conscience d’accueil, de protection et d’amour. Stimule la présence maternelle et l’amour de soi dans le parcours de soin.",
        "indications": [
          "Renforce les liens affectifs",
          "Favorise l’accueil et la protection",
          "Stimule l’amour de soi",
          "Soutient la présence maternelle"
        ]
      }
    }
  },
  {
    "id": "bioluz",
    "name": "BioLuz",
    "category": "mente",
    "volume": "60ml",
    "price": 0.1,
    "image": "assets/img/prod-bioluz.jpg",
    "audio": "assets/audio/bioluz.mp3",
    "tagline": "Coerência | Alinhamento interior | Iluminação vibracional",
    "description": "Gera harmonia entre pensamento, sentimento, ação e palavras. Atua como um campo de iluminação vibracional para fortalecer a aura e expandir a consciência.",
    "indications": [
      "Favorece coerência entre mente, coração e atitude",
      "Estimula clareza e autenticidade nas escolhas",
      "Ilumina o campo áurico e amplia a proteção energética",
      "Equilibra o ser interior e o mundo exterior"
    ],
    "i18n": {
      "pt": {
        "tagline": "Coerência | Alinhamento interior | Iluminação vibracional",
        "description": "Gera harmonia entre pensamento, sentimento, ação e palavras. Atua como um campo de iluminação vibracional para fortalecer a aura e expandir a consciência.",
        "indications": [
          "Favorece coerência entre mente, coração e atitude",
          "Estimula clareza e autenticidade nas escolhas",
          "Ilumina o campo áurico e amplia a proteção energética",
          "Equilibra o ser interior e o mundo exterior"
        ]
      },
      "en": {
        "tagline": "Coherence | Inner alignment | Vibrational illumination",
        "description": "Creates harmony between thought, feeling, action and words. It acts as a field of vibrational illumination to strengthen the aura and expand consciousness.",
        "indications": [
          "Favors coherence between mind, heart and attitude",
          "Stimulates clarity and authenticity in choices",
          "Illuminates the auric field and expands energetic protection",
          "Balances the inner being and the outer world"
        ]
      },
      "de": {
        "tagline": "Kohärenz | Innere Ausrichtung | Vibrationale Erleuchtung",
        "description": "Erzeugt Harmonie zwischen Denken, Fühlen, Handeln und Worten. Wirkt als Feld vibrationaler Erleuchtung, um die Aura zu stärken und das Bewusstsein zu erweitern.",
        "indications": [
          "Fördert Kohärenz zwischen Geist, Herz und Haltung",
          "Anregt Klarheit und Authentizität in Entscheidungen",
          "Erhellt das aurische Feld und erweitert energetischen Schutz",
          "Balanceiert das innere Sein und die äußere Welt"
        ]
      },
      "es": {
        "tagline": "Coherencia | Alineación interior | Iluminación vibracional",
        "description": "Genera armonía entre pensamiento, sentimiento, acción y palabras. Actúa como un campo de iluminación vibracional para fortalecer el aura y expandir la conciencia.",
        "indications": [
          "Favorece la coherencia entre mente, corazón y actitud",
          "Estimula claridad y autenticidad en las elecciones",
          "Ilumina el campo áurico y amplía la protección energética",
          "Equilibra el ser interior y el mundo exterior"
        ]
      },
      "fr": {
        "tagline": "Cohérence | Alignement intérieur | Illumination vibrationnelle",
        "description": "Crée de l’harmonie entre pensée, sentiment, action et paroles. Agit comme un champ d’illumination vibrationnelle pour plus de cohérence et d’alignement intérieur.",
        "indications": [
          "Favorise la cohérence intérieure",
          "Aide à aligner pensée, sentiment et action",
          "Soutient l’illumination vibrationnelle",
          "Complète le parcours CEME"
        ]
      }
    }
  },
  {
    "id": "neurointestino",
    "name": "NeuroIntestino Balance",
    "category": "corpo",
    "volume": "60ml",
    "price": 0.1,
    "image": "assets/img/prod-neurointestino.jpg",
    "audio": "assets/audio/neurointestino.mp3",
    "tagline": "Reprogramação do eixo intestino-cérebro",
    "description": "Promove a saúde completa do sistema gastrointestinal. Harmoniza, regenera e otimiza o trato digestivo, da digestão à absorção de nutrientes.",
    "indications": [
      "Melhora a função digestiva e reduz desconfortos",
      "Restaura a mucosa intestinal e o equilíbrio da microbiota",
      "Auxilia a absorção de vitaminas e minerais",
      "Regula o trânsito intestinal",
      "Reduz processos inflamatórios do trato digestivo"
    ],
    "i18n": {
      "pt": {
        "tagline": "Reprogramação do eixo intestino-cérebro",
        "description": "Promove a saúde completa do sistema gastrointestinal. Harmoniza, regenera e otimiza o trato digestivo, da digestão à absorção de nutrientes.",
        "indications": [
          "Melhora a função digestiva e reduz desconfortos",
          "Restaura a mucosa intestinal e o equilíbrio da microbiota",
          "Auxilia a absorção de vitaminas e minerais",
          "Regula o trânsito intestinal",
          "Reduz processos inflamatórios do trato digestivo"
        ]
      },
      "en": {
        "tagline": "Reprogramming the gut-brain axis",
        "description": "Promotes complete gastrointestinal health. It harmonizes, regenerates and optimizes the digestive tract, from digestion to nutrient absorption.",
        "indications": [
          "Improves digestive function and reduces discomfort",
          "Restores intestinal mucosa and microbiota balance",
          "Supports absorption of vitamins and minerals",
          "Regulates intestinal transit",
          "Helps reduce inflammatory processes in the digestive tract"
        ]
      },
      "de": {
        "tagline": "Neuprogrammierung der Darm-Hirn-Achse",
        "description": "Fördert die ganzheitliche Gesundheit des Magen-Darm-Systems. Harmonisiert, regeneriert und optimiert den Verdauungstrakt – von der Verdauung bis zur Nährstoffaufnahme.",
        "indications": [
          "Verbessert die Verdauungsfunktion und mindert Unwohlsein",
          "Stellt Darmschleimhaut und Mikrobiota-Balance wieder her",
          "Unterstützt die Aufnahme von Vitaminen und Mineralstoffen",
          "Reguliert den Darmtransit",
          "Hilft, entzündliche Prozesse im Verdauungstrakt zu reduzieren"
        ]
      },
      "es": {
        "tagline": "Reprogramación del eje intestino-cerebro",
        "description": "Promueve la salud completa del sistema gastrointestinal. Armoniza, regenera y optimiza el tracto digestivo, desde la digestión hasta la absorción de nutrientes.",
        "indications": [
          "Mejora la función digestiva y reduce molestias",
          "Restaura la mucosa intestinal y el equilibrio de la microbiota",
          "Auxilia la absorción de vitaminas y minerales",
          "Regula el tránsito intestinal",
          "Reduce procesos inflamatorios del tracto digestivo"
        ]
      },
      "fr": {
        "tagline": "Reprogrammation de l’axe intestin-cerveau",
        "description": "Favorise une santé gastro-intestinale complète. Harmonise, régénère et optimise le tube digestif, de la digestion à l’axe intestin-cerveau.",
        "indications": [
          "Soutient l’axe intestin-cerveau",
          "Favorise l’harmonie digestive",
          "Aide à la régénération du tractus digestif",
          "Complète le soin intégratif"
        ]
      }
    }
  },
  {
    "id": "emoser",
    "name": "EmoSer",
    "category": "emocao",
    "volume": "60ml",
    "price": 0.1,
    "image": "assets/img/prod-emoser.jpg",
    "audio": "assets/audio/emoser.mp3",
    "tagline": "Equilíbrio emocional | Medo, raiva e choro",
    "description": "Traz harmonia às emoções, favorecendo equilíbrio interior e estabilidade. Ajuda a regular respostas intensas como medo, raiva e choro emocional, com mais serenidade no cotidiano.",
    "indications": [
      "Promove equilíbrio emocional diante de desafios",
      "Auxilia na regulação de medo, raiva e crises emocionais",
      "Favorece estabilidade em situações de estresse",
      "Estimula paz e clareza interior"
    ],
    "i18n": {
      "pt": {
        "tagline": "Equilíbrio emocional | Medo, raiva e choro",
        "description": "Traz harmonia às emoções, favorecendo equilíbrio interior e estabilidade. Ajuda a regular respostas intensas como medo, raiva e choro emocional, com mais serenidade no cotidiano.",
        "indications": [
          "Promove equilíbrio emocional diante de desafios",
          "Auxilia na regulação de medo, raiva e crises emocionais",
          "Favorece estabilidade em situações de estresse",
          "Estimula paz e clareza interior"
        ]
      },
      "en": {
        "tagline": "Emotional balance | Fear, anger and crying",
        "description": "Brings harmony to emotions, favoring inner balance and stability. It helps regulate intense responses such as fear, anger and emotional crying, with more serenity in daily life.",
        "indications": [
          "Promotes emotional balance in the face of challenges",
          "Supports regulation of fear, anger and emotional crises",
          "Favors stability in stressful situations",
          "Stimulates inner peace and clarity"
        ]
      },
      "de": {
        "tagline": "Emotionales Gleichgewicht | Angst, Wut und Weinen",
        "description": "Bringt Harmonie in die Emotionen und fördert inneren Ausgleich sowie Stabilität. Hilft, intensive Reaktionen wie Angst, Wut und emotionales Weinen zu regulieren – mit mehr Gelassenheit im Alltag.",
        "indications": [
          "Fördert emotionales Gleichgewicht angesichts von Herausforderungen",
          "Unterstützt die Regulation von Angst, Wut und emotionalen Krisen",
          "Begünstigt Stabilität in Stresssituationen",
          "Anregt inneren Frieden und Klarheit"
        ]
      },
      "es": {
        "tagline": "Armonía emocional | Serenidad | Estabilidad interior",
        "description": "Aporta armonía a las emociones, favoreciendo el equilibrio interior y la estabilidad. Ayuda a regular respuestas intensas como miedo, ira y llanto emocional, con más serenidad en lo cotidiano.",
        "indications": [
          "Promueve equilibrio emocional ante los desafíos",
          "Ayuda en la regulación del miedo, la ira y las crisis emocionales",
          "Favorece la estabilidad en situaciones de estrés",
          "Estimula paz y claridad interior"
        ]
      },
      "fr": {
        "tagline": "Équilibre émotionnel | Peur, colère et pleurs",
        "description": "Apporte de l’harmonie aux émotions, favorisant l’équilibre et la stabilité intérieurs. Aide à réguler des réponses intenses comme la peur, la colère et les pleurs.",
        "indications": [
          "Favorise l’équilibre émotionnel",
          "Aide à réguler peur, colère et pleurs",
          "Soutient la stabilité intérieure",
          "Complète le travail émotionnel CEME"
        ]
      }
    }
  },
  {
    "id": "presenca",
    "name": "Presença",
    "category": "mente",
    "volume": "60ml",
    "price": 0.1,
    "image": "assets/img/prod-presenca.jpg",
    "audio": "assets/audio/presenca.mp3",
    "tagline": "Aqui e agora | Neuroplasticidade | Potencial individual",
    "description": "Desenvolvido para apoiar mentes atípicas e a presença no aqui e agora. Otimiza a absorção de nutrientes e energia nos quatro corpos, favorecendo neuroplasticidade e potencial individual.",
    "indications": [
      "Mantém a saúde física, mental, emocional e energética",
      "Fortalece a imunidade",
      "Previne distrações e dispersões",
      "Estimula a presença plena no aqui e agora",
      "Apoia o desenvolvimento do potencial individual"
    ],
    "i18n": {
      "pt": {
        "tagline": "Aqui e agora | Neuroplasticidade | Potencial individual",
        "description": "Desenvolvido para apoiar mentes atípicas e a presença no aqui e agora. Otimiza a absorção de nutrientes e energia nos quatro corpos, favorecendo neuroplasticidade e potencial individual.",
        "indications": [
          "Mantém a saúde física, mental, emocional e energética",
          "Fortalece a imunidade",
          "Previne distrações e dispersões",
          "Estimula a presença plena no aqui e agora",
          "Apoia o desenvolvimento do potencial individual"
        ]
      },
      "en": {
        "tagline": "Here and now | Neuroplasticity | Individual potential",
        "description": "Developed to support atypical minds and presence in the here and now. It optimizes absorption of nutrients and energy across the four bodies, favoring neuroplasticity and individual potential.",
        "indications": [
          "Supports physical, mental, emotional and energetic health",
          "Strengthens immunity",
          "Helps prevent distraction and dispersion",
          "Stimulates full presence in the here and now",
          "Supports development of individual potential"
        ]
      },
      "de": {
        "tagline": "Hier und jetzt | Neuroplastizität | Individuelles Potenzial",
        "description": "Entwickelt zur Unterstützung atypischer Geister und der Präsenz im Hier und Jetzt. Optimiert die Aufnahme von Nährstoffen und Energie in den vier Körpern und fördert Neuroplastizität sowie individuelles Potenzial.",
        "indications": [
          "Unterstützt physische, mentale, emotionale und energetische Gesundheit",
          "Stärkt die Immunität",
          "Hilft, Ablenkung und Zerstreuung zu vermeiden",
          "Anregt volle Präsenz im Hier und Jetzt",
          "Unterstützt die Entfaltung individuellen Potenzials"
        ]
      },
      "es": {
        "tagline": "Presencia | Aquí y ahora | Neuroplasticidad",
        "description": "Desarrollado para apoyar mentes atípicas y la presencia en el aquí y ahora. Optimiza la absorción de nutrientes y energía en los cuatro cuerpos, favoreciendo la neuroplasticidad y el potencial individual.",
        "indications": [
          "Mantiene la salud física, mental, emocional y energética",
          "Fortalece la inmunidad",
          "Previene distracciones y dispersiones",
          "Estimula la presencia plena en el aquí y ahora",
          "Apoya el desarrollo del potencial individual"
        ]
      },
      "fr": {
        "tagline": "Ici et maintenant | Neuroplasticité | Potentiel individuel",
        "description": "Conçu pour soutenir les esprits atypiques et la présence ici et maintenant. Optimise l’absorption des nutriments informationnels et stimule la neuroplasticité.",
        "indications": [
          "Favorise la présence ici et maintenant",
          "Soutient la neuroplasticité",
          "Aide les esprits atypiques",
          "Stimule le potentiel individuel"
        ]
      }
    }
  },
  {
    "id": "pertencimento",
    "name": "Pertencimento",
    "category": "emocao",
    "volume": "60ml",
    "price": 0.1,
    "image": "assets/img/prod-pertencimento.jpg",
    "audio": "assets/audio/pertencimento.mp3",
    "tagline": "Conexão | Integração | Vínculo com o Todo",
    "description": "Desperta um sentimento profundo de união, conexão e integração. Sua frequência vibra no princípio “somos um”, fortalecendo vínculos e empatia nos campos físico, emocional, mental e espiritual.",
    "indications": [
      "Estimula conexão e acolhimento",
      "Promove integração e vínculos saudáveis",
      "Reduz a sensação de isolamento e separação",
      "Expande a consciência de unidade e coletividade"
    ],
    "i18n": {
      "pt": {
        "tagline": "Conexão | Integração | Vínculo com o Todo",
        "description": "Desperta um sentimento profundo de união, conexão e integração. Sua frequência vibra no princípio “somos um”, fortalecendo vínculos e empatia nos campos físico, emocional, mental e espiritual.",
        "indications": [
          "Estimula conexão e acolhimento",
          "Promove integração e vínculos saudáveis",
          "Reduz a sensação de isolamento e separação",
          "Expande a consciência de unidade e coletividade"
        ]
      },
      "en": {
        "tagline": "Connection | Integration | Bond with the Whole",
        "description": "Awakens a deep feeling of union, connection and integration. Its frequency vibrates with the principle “we are one”, strengthening bonds and empathy across physical, emotional, mental and spiritual fields.",
        "indications": [
          "Stimulates connection and welcome",
          "Promotes integration and healthy bonds",
          "Reduces feelings of isolation and separation",
          "Expands awareness of unity and collectivity"
        ]
      },
      "de": {
        "tagline": "Verbindung | Integration | Bindung an das Ganze",
        "description": "Weckt ein tiefes Gefühl von Einheit, Verbindung und Integration. Die Frequenz schwingt mit dem Prinzip „wir sind eins“ und stärkt Bindungen sowie Empathie in physischen, emotionalen, mentalen und spirituellen Feldern.",
        "indications": [
          "Fördert Verbindung und Annahme",
          "Unterstützt Integration und gesunde Bindungen",
          "Reduziert das Gefühl von Isolation und Trennung",
          "Erweitert das Bewusstsein für Einheit und Gemeinschaft"
        ]
      },
      "es": {
        "tagline": "Unión | Conexión | Sentido de pertenencia",
        "description": "Despierta un sentimiento profundo de unión, conexión e integración. Su frecuencia vibra en el principio “somos uno”, fortaleciendo vínculos y empatía en los campos físico, emocional, mental y espiritual.",
        "indications": [
          "Fortalece el sentido de pertenencia",
          "Estimula empatía y conexión con el otro",
          "Favorece la integración en grupos y vínculos",
          "Apoya la unión en los cuatro cuerpos"
        ]
      },
      "fr": {
        "tagline": "Connexion | Intégration | Lien avec le Tout",
        "description": "Éveille un sentiment profond d’union, de connexion et d’intégration. Sa fréquence vibre avec le principe « nous faisons partie du Tout ».",
        "indications": [
          "Favorise le sentiment d’appartenance",
          "Soutient la connexion et l’intégration",
          "Renforce le lien avec le Tout",
          "Complète la dimension spirituelle du soin"
        ]
      }
    }
  },
  {
    "id": "biometal",
    "name": "BioMetal Free",
    "category": "detox",
    "volume": "60ml",
    "price": 0.1,
    "image": "assets/img/prod-biometal.jpg",
    "audio": "assets/audio/biometal.mp3",
    "tagline": "Drenagem vibracional de metais pesados",
    "description": "Promove informação biofísica ao organismo, potencializando a eliminação homeostática de metais pesados. Contém frequências de destoxificação hepática fases 1 e 2 e fitoterápicos de limpeza hepática e biliar.",
    "indications": [
      "Auxilia na quelação de metais pesados",
      "Equilibra os processos naturais de limpeza do organismo",
      "Auxilia no tratamento de gordura visceral",
      "Apoia tratamentos de inflamação sistêmica"
    ],
    "i18n": {
      "pt": {
        "tagline": "Drenagem vibracional de metais pesados",
        "description": "Promove informação biofísica ao organismo, potencializando a eliminação homeostática de metais pesados. Contém frequências de destoxificação hepática fases 1 e 2 e fitoterápicos de limpeza hepática e biliar.",
        "indications": [
          "Auxilia na quelação de metais pesados",
          "Equilibra os processos naturais de limpeza do organismo",
          "Auxilia no tratamento de gordura visceral",
          "Apoia tratamentos de inflamação sistêmica"
        ]
      },
      "en": {
        "tagline": "Vibrational drainage of heavy metals",
        "description": "Promotes biophysical information to the organism, potentiating homeostatic elimination of heavy metals. It includes hepatic detoxification frequencies for phases 1 and 2 and phytotherapeutic support for liver and biliary cleansing.",
        "indications": [
          "Supports heavy metal chelation",
          "Balances the organism’s natural cleansing processes",
          "Supports visceral fat care protocols",
          "Supports systemic inflammation protocols"
        ]
      },
      "de": {
        "tagline": "Vibrationale Drainage von Schwermetallen",
        "description": "Fördert biophysikalische Information an den Organismus und potenziert die homöostatische Ausscheidung von Schwermetallen. Enthält Frequenzen der Leberdetoxifikation der Phasen 1 und 2 sowie phytotherapeutische Unterstützung für Leber- und Gallereinigung.",
        "indications": [
          "Unterstützt die Chelatbildung von Schwermetallen",
          "Balanceiert natürliche Reinigungsprozesse des Organismus",
          "Unterstützt Protokolle bei viszeralem Fett",
          "Unterstützt Protokolle bei systemischer Entzündung"
        ]
      },
      "es": {
        "tagline": "Desintoxicación de metales pesados | Limpieza hepática",
        "description": "Promueve información biofísica al organismo, potenciando la eliminación homeostática de metales pesados. Contiene frecuencias de desintoxicación hepática fases 1 y 2 y fitoterápicos de limpieza hepática y biliar.",
        "indications": [
          "Ayuda en la quelación de metales pesados",
          "Equilibra los procesos naturales de limpieza del organismo",
          "Ayuda en el tratamiento de grasa visceral",
          "Apoya tratamientos de inflamación sistémica"
        ]
      },
      "fr": {
        "tagline": "Drainage vibrationnel des métaux lourds",
        "description": "Favorise une information biophysique pour l’organisme, potentialisant l’élimination homéostatique des métaux lourds. Inclut un soutien hépatique dans le protocole fréquentiel.",
        "indications": [
          "Soutient le drainage des métaux lourds",
          "Favorise l’élimination homéostatique",
          "Aide le terrain hépatique",
          "Complète les protocoles de détox CEME"
        ]
      }
    }
  },
  {
    "id": "lymphoflow",
    "name": "LymphoFlow Quantum",
    "category": "detox",
    "volume": "60ml",
    "price": 0.1,
    "image": "assets/img/prod-lymphoflow.jpg",
    "audio": "assets/audio/lymphoflow.mp3",
    "tagline": "Estímulo à drenagem energética e emocional",
    "description": "Potencializa a liberação homeostática de homotoxinas e a função de todo o sistema linfático, por correção biofísica celular. Fórmula com frequências de fitoterápicos chineses, brasileiros e homotoxicologia alemã.",
    "indications": [
      "Limpeza do terreno biológico",
      "Ativação da drenagem linfática orgânica",
      "Apoio em tratamentos estéticos de peso, celulite e inflamação"
    ],
    "i18n": {
      "pt": {
        "tagline": "Estímulo à drenagem energética e emocional",
        "description": "Potencializa a liberação homeostática de homotoxinas e a função de todo o sistema linfático, por correção biofísica celular. Fórmula com frequências de fitoterápicos chineses, brasileiros e homotoxicologia alemã.",
        "indications": [
          "Limpeza do terreno biológico",
          "Ativação da drenagem linfática orgânica",
          "Apoio em tratamentos estéticos de peso, celulite e inflamação"
        ]
      },
      "en": {
        "tagline": "Stimulus for energetic and emotional drainage",
        "description": "Potentiates homeostatic release of homotoxins and the function of the entire lymphatic system through cellular biophysical correction. Formula with frequencies from Chinese and Brazilian phytotherapy and German homotoxicology.",
        "indications": [
          "Cleansing of the biological terrain",
          "Activation of organic lymphatic drainage",
          "Support for aesthetic protocols related to weight, cellulite and inflammation"
        ]
      },
      "de": {
        "tagline": "Anregung der energetischen und emotionalen Drainage",
        "description": "Potenziert die homöostatische Freisetzung von Homotoxinen und die Funktion des gesamten Lymphsystems durch zelluläre biophysikalische Korrektur. Formel mit Frequenzen chinesischer und brasilianischer Phytotherapie sowie deutscher Homotoxikologie.",
        "indications": [
          "Reinigung des biologischen Terrains",
          "Aktivierung der organischen Lymphdrainage",
          "Unterstützung ästhetischer Protokolle zu Gewicht, Cellulite und Entzündung"
        ]
      },
      "es": {
        "tagline": "Flujo linfático | Liberación de homotoxinas",
        "description": "Potencia la liberación homeostática de homotoxinas y la función de todo el sistema linfático, por corrección biofísica celular. Fórmula con frecuencias de fitoterápicos chinos, brasileños y homotoxicología alemana.",
        "indications": [
          "Limpieza del terreno biológico",
          "Activación del drenaje linfático orgánico",
          "Apoyo en tratamientos estéticos de peso, celulitis e inflamación"
        ]
      },
      "fr": {
        "tagline": "Stimulus pour le drainage énergétique et émotionnel",
        "description": "Potentialise la libération homéostatique des homotoxines et la fonction de tout le système lymphatique via une information cellulaire fréquentiellement organisée.",
        "indications": [
          "Soutient le drainage lymphatique",
          "Favorise la libération énergétique et émotionnelle",
          "Aide la fonction du système lymphatique",
          "Complète les soins de flux et de détox"
        ]
      }
    }
  },
  {
    "id": "mente-serena",
    "name": "Mente Serena",
    "category": "sensorial",
    "volume": "60ml",
    "price": 0.1,
    "image": "assets/img/prod-mente-serena.jpg",
    "audio": "assets/audio/mente-serena.mp3",
    "tagline": "Redução de hiperatividade, bruxismo e estresse",
    "description": "Harmoniza mente e corpo, aliviando sintomas de estresse e tensões relacionadas ao bruxismo. Favorece calma, presença e paz interior no ritmo do dia a dia.",
    "indications": [
      "Reduz hiperatividade mental e física",
      "Auxilia no controle do bruxismo",
      "Equilibra estresse e ansiedade",
      "Estimula calma e paz interior"
    ],
    "i18n": {
      "pt": {
        "tagline": "Redução de hiperatividade, bruxismo e estresse",
        "description": "Harmoniza mente e corpo, aliviando sintomas de estresse e tensões relacionadas ao bruxismo. Favorece calma, presença e paz interior no ritmo do dia a dia.",
        "indications": [
          "Reduz hiperatividade mental e física",
          "Auxilia no controle do bruxismo",
          "Equilibra estresse e ansiedade",
          "Estimula calma e paz interior"
        ]
      },
      "en": {
        "tagline": "Reduction of hyperactivity, bruxism and stress",
        "description": "Harmonizes mind and body, easing stress symptoms and tensions related to bruxism. It favors calm, presence and inner peace in the rhythm of daily life.",
        "indications": [
          "Reduces mental and physical hyperactivity",
          "Supports bruxism control",
          "Balances stress and anxiety",
          "Stimulates calm and inner peace"
        ]
      },
      "de": {
        "tagline": "Reduktion von Hyperaktivität, Bruxismus und Stress",
        "description": "Harmonisiert Geist und Körper, lindert Stresssymptome und Spannungen im Zusammenhang mit Bruxismus. Fördert Ruhe, Präsenz und inneren Frieden im Alltag.",
        "indications": [
          "Reduziert mentale und physische Hyperaktivität",
          "Unterstützt die Kontrolle von Bruxismus",
          "Balanceiert Stress und Angst",
          "Anregt Ruhe und inneren Frieden"
        ]
      },
      "es": {
        "tagline": "Calma mental | Alivio del estrés | Bruxismo",
        "description": "Armoniza mente y cuerpo, aliviando síntomas de estrés y tensiones relacionadas con el bruxismo. Favorece calma, presencia y paz interior en el ritmo del día a día.",
        "indications": [
          "Reduce la hiperactividad mental y física",
          "Ayuda en el control del bruxismo",
          "Equilibra el estrés y la ansiedad",
          "Estimula calma y paz interior"
        ]
      },
      "fr": {
        "tagline": "Réduction de l’hyperactivité, du bruxisme et du stress",
        "description": "Harmonise l’esprit et le corps, apaisant les symptômes de stress et les tensions liées au bruxisme. Favorise le calme, la présence et des états de plus grande sérénité.",
        "indications": [
          "Favorise le calme mental",
          "Aide face à l’hyperactivité et au stress",
          "Soutient en cas de tensions liées au bruxisme",
          "Complète le soin de régulation CEME"
        ]
      }
    }
  },
  {
    "id": "campo-morfogenetico",
    "name": "Análise do Campo Morfogenético",
    "category": "frequencial",
    "volume": "avaliação",
    "price": 0.1,
    "image": "assets/img/mapa-holografico.jpg",
    "audio": null,
    "kind": "morfo",
    "tagline": "Leitura do campo morfogenético",
    "description": "A Análise do Campo Morfogenético é uma leitura do campo vivo de informação da pessoa — corpo, emoção, mente e espírito — para revelar padrões e orientar o cuidado no Método CEME.",
    "indications": [
      "Leitura do campo morfogenético",
      "Ajuda a revelar padrões e memórias",
      "Orienta o cuidado no Método CEME",
      "Atuação nos quatro corpos"
    ],
    "i18n": {
      "pt": {
        "tagline": "Leitura do campo morfogenético",
        "description": "A Análise do Campo Morfogenético é uma leitura do campo vivo de informação da pessoa — corpo, emoção, mente e espírito — para revelar padrões e orientar o cuidado no Método CEME.",
        "indications": [
          "Leitura do campo morfogenético",
          "Ajuda a revelar padrões e memórias",
          "Orienta o cuidado no Método CEME",
          "Atuação nos quatro corpos"
        ]
      },
      "en": {
        "tagline": "Morphogenetic field reading",
        "description": "The Morphogenetic Field Analysis is a reading of the person's living field of information — body, emotion, mind and spirit — to reveal patterns and guide care in the CEME Method.",
        "indications": [
          "Morphogenetic field reading",
          "Helps reveal patterns and memories",
          "Guides care within the CEME Method",
          "Works across the four bodies"
        ]
      },
      "de": {
        "tagline": "Lesung des morphogenetischen Feldes",
        "description": "Die Analyse des morphogenetischen Feldes liest das lebendige Informationsfeld der Person — Körper, Emotion, Geist und Seele — um Muster zu erkennen und die Pflege in der CEME-Methode zu orientieren.",
        "indications": [
          "Lesung des morphogenetischen Feldes",
          "Hilft, Muster und Erinnerungen zu erkennen",
          "Orientiert die Pflege in der CEME-Methode",
          "Wirkt auf die vier Körper"
        ]
      },
      "es": {
        "tagline": "Lectura del campo morfogenético",
        "description": "El Análisis del Campo Morfogenético es una lectura del campo vivo de información de la persona — cuerpo, emoción, mente y espíritu — para revelar patrones y orientar el cuidado en el Método CEME.",
        "indications": [
          "Lectura del campo morfogenético",
          "Ayuda a revelar patrones y memorias",
          "Orienta el cuidado en el Método CEME",
          "Actúa en los cuatro cuerpos"
        ]
      },
      "fr": {
        "tagline": "Lecture du champ morphogénétique",
        "description": "L’Analyse du Champ Morphogénétique est une lecture du champ vivant d’information de la personne — corps, émotion, mental et esprit — pour révéler des schémas et orienter le soin dans la Méthode CEME.",
        "indications": [
          "Lecture du champ morphogénétique",
          "Aide à révéler schémas et mémoires",
          "Oriente le soin dans la Méthode CEME",
          "Agit sur les quatre corps"
        ]
      }
    }
  },
  {
    "id": "musicas-neuroconectivas",
    "name": "Déclic — Liberte sua Expressão",
    "category": "frequencial",
    "volume": "digital",
    "price": 0.1,
    "image": "assets/img/declic-liberte-sua-expressao.jpg",
    "audio": null,
    "kind": "musica",
    "tagline": "Álbum digital · 8 faixas",
    "description": "Déclic — Liberte sua Expressão: oito faixas num álbum só, para ouvir e comprar neste site. O disco completo libera depois do pagamento aprovado.",
    "indications": [
      "8 faixas no mesmo álbum",
      "Prévia curta na loja",
      "Download após o pagamento",
      "Sem faixa avulsa"
    ],
    "i18n": {
      "pt": {
        "tagline": "Álbum digital · 8 faixas",
        "description": "Déclic — Liberte sua Expressão: oito faixas num álbum só, para ouvir e comprar neste site. O disco completo libera depois do pagamento aprovado.",
        "indications": [
          "8 faixas no mesmo álbum",
          "Prévia curta na loja",
          "Download após o pagamento",
          "Sem faixa avulsa"
        ]
      },
      "en": {
        "tagline": "Digital album · 8 tracks",
        "description": "Déclic — Liberte sua Expressão: eight tracks in one album, to listen and buy on this site. The full record unlocks after approved payment.",
        "indications": [
          "8 tracks in one album",
          "Short preview in the shop",
          "Download after payment",
          "No single-track sale"
        ]
      },
      "de": {
        "tagline": "Digitales Album · 8 Titel",
        "description": "Déclic — Liberte sua Expressão: acht Titel in einem Album, zum Hören und Kaufen auf dieser Website. Die volle Platte erscheint nach bestätigter Zahlung.",
        "indications": [
          "8 Titel in einem Album",
          "Kurze Vorschau im Shop",
          "Download nach der Zahlung",
          "Ohne Einzelverkauf"
        ]
      },
      "es": {
        "tagline": "Álbum digital · 8 pistas",
        "description": "Déclic — Liberte sua Expressão: ocho pistas en un solo álbum, para escuchar y comprar en este sitio. El disco completo se libera tras el pago aprobado.",
        "indications": [
          "8 pistas en el mismo álbum",
          "Previa corta en la tienda",
          "Descarga tras el pago",
          "Sin pista suelta"
        ]
      },
      "fr": {
        "tagline": "Album numérique · 8 titres",
        "description": "Déclic — Liberte sua Expressão : huit titres dans un seul album, à écouter et acheter sur ce site. Le disque complet se débloque après le paiement approuvé.",
        "indications": [
          "8 titres dans le même album",
          "Extrait court dans la boutique",
          "Téléchargement après le paiement",
          "Sans titre à l’unité"
        ]
      }
    }
  },
  {
    "id": "musica-neuroconexao",
    "name": "Neuro-conexão",
    "category": "frequencial",
    "volume": "personalizada",
    "price": 0.1,
    "image": "assets/img/musicas-neuroconectivas.jpg",
    "audio": null,
    "kind": "neuro",
    "tagline": "Música personalizada com base na avaliação",
    "description": "Neuro-conexão é uma música personalizada criada a partir da sua avaliação no Método CEME — uma frequência sonora sob medida para o seu processo.",
    "indications": [
      "Música personalizada",
      "Com base na avaliação CEME",
      "Entrega digital",
      "Complemento ao Método CEME"
    ],
    "i18n": {
      "pt": {
        "tagline": "Música personalizada com base na avaliação",
        "description": "Neuro-conexão é uma música personalizada criada a partir da sua avaliação no Método CEME — uma frequência sonora sob medida para o seu processo.",
        "indications": [
          "Música personalizada",
          "Com base na avaliação CEME",
          "Entrega digital",
          "Complemento ao Método CEME"
        ]
      },
      "en": {
        "tagline": "Personalized music based on your assessment",
        "description": "Neuro-conexão is a personalized piece created from your CEME Method assessment — a sound frequency tailored to your process.",
        "indications": [
          "Personalized music",
          "Based on the CEME assessment",
          "Digital delivery",
          "Complements the CEME Method"
        ]
      },
      "de": {
        "tagline": "Personalisierte Musik auf Basis der Bewertung",
        "description": "Neuro-conexão ist ein personalisiertes Stück auf Basis Ihrer CEME-Bewertung — eine Klangfrequenz für Ihren Prozess.",
        "indications": [
          "Personalisierte Musik",
          "Auf Basis der CEME-Bewertung",
          "Digitale Lieferung",
          "Ergänzt die CEME-Methode"
        ]
      },
      "es": {
        "tagline": "Música personalizada según la evaluación",
        "description": "Neuro-conexión es una música personalizada creada a partir de su evaluación en el Método CEME — una frecuencia sonora a medida para su proceso.",
        "indications": [
          "Música personalizada",
          "Según la evaluación CEME",
          "Entrega digital",
          "Complemento al Método CEME"
        ]
      },
      "fr": {
        "tagline": "Musique personnalisée selon l’évaluation",
        "description": "Neuro-conexão est une musique personnalisée créée à partir de votre évaluation dans la Méthode CEME — une fréquence sonore sur mesure pour votre processus.",
        "indications": [
          "Musique personnalisée",
          "Selon l’évaluation CEME",
          "Livraison numérique",
          "Complément à la Méthode CEME"
        ]
      }
    }
  }

];

if (typeof module !== "undefined") {
  module.exports = { PRODUCTS, WHATSAPP };
}
