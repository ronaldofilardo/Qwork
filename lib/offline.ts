import { openDB, DBSchema, IDBPDatabase } from "idb";

interface BPSDatabase extends DBSchema {
  "avaliacoes-pendentes": {
    key: number;
    value: {
      id?: number;
      grupo: number;
      respostas: Array<{ item: string; valor: number; grupo: number }>;
      timestamp: number;
    };
  };
  "respostas-cache": {
    key: string;
    value: {
      grupo: number;
      respostas: Map<string, number>;
      timestamp: number;
    };
  };
  "funcionarios-cache": {
    key: string;
    value: {
      cpf: string;
      nome: string;
      indice_avaliacao: number;
      data_ultimo_lote: string | null;
      timestamp: number;
    };
    indexes: {
      indice_avaliacao_idx: "indice_avaliacao";
      data_ultimo_lote_idx: "data_ultimo_lote";
    };
  };
}

let db: IDBPDatabase<BPSDatabase> | null = null;

async function getDB() {
  if (!db) {
    db = await openDB<BPSDatabase>("bps-brasil-db", 3, {
      upgrade(idb, oldVersion) {
        // Store para avaliações pendentes de sincronização
        if (!idb.objectStoreNames.contains("avaliacoes-pendentes")) {
          idb.createObjectStore("avaliacoes-pendentes", {
            keyPath: "id",
            autoIncrement: true,
          });
        }

        // Store para cache de respostas
        if (!idb.objectStoreNames.contains("respostas-cache")) {
          idb.createObjectStore("respostas-cache");
        }

        // Versão 3: Store para cache de funcionários com índice
        if (
          oldVersion < 3 &&
          !idb.objectStoreNames.contains("funcionarios-cache")
        ) {
          const funcionariosStore = idb.createObjectStore(
            "funcionarios-cache",
            {
              keyPath: "cpf",
            }
          );
          // Criar índices para busca eficiente
          funcionariosStore.createIndex(
            "indice_avaliacao_idx",
            "indice_avaliacao"
          );
          funcionariosStore.createIndex(
            "data_ultimo_lote_idx",
            "data_ultimo_lote"
          );
        }
      },
    });
  }
  return db;
}

// Salvar avaliação pendente (offline)
export async function salvarAvaliacaoPendente(
  grupo: number,
  respostas: Array<{ item: string; valor: number; grupo: number }>
) {
  const database = await getDB();
  await database.add("avaliacoes-pendentes", {
    grupo,
    respostas,
    timestamp: Date.now(),
  });
}

// Obter avaliações pendentes
export async function getAvaliacoesPendentes() {
  const database = await getDB();
  return await database.getAll("avaliacoes-pendentes");
}

// Limpar avaliação pendente
export async function limparAvaliacaoPendente(id: number) {
  const database = await getDB();
  await database.delete("avaliacoes-pendentes", id);
}

// Salvar respostas em cache
export async function salvarRespostasCache(
  grupo: number,
  respostas: Map<string, number>
) {
  const database = await getDB();
  await database.put(
    "respostas-cache",
    {
      grupo,
      respostas,
      timestamp: Date.now(),
    },
    `grupo-${grupo}`
  );
}

// Obter respostas do cache
export async function getRespostasCache(grupo: number) {
  const database = await getDB();
  return await database.get("respostas-cache", `grupo-${grupo}`);
}

// Limpar cache expirado (mais de 7 dias)
export async function limparCacheExpirado() {
  const database = await getDB();
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

  const allCache = await database.getAll("respostas-cache");
  for (const cache of allCache) {
    if (cache.timestamp < sevenDaysAgo) {
      await database.delete("respostas-cache", `grupo-${cache.grupo}`);
    }
  }
}

// Salvar índice de funcionário no cache
export async function salvarIndiceFuncionario(
  cpf: string,
  nome: string,
  indice_avaliacao: number,
  data_ultimo_lote: string | null
) {
  const database = await getDB();
  await database.put("funcionarios-cache", {
    cpf,
    nome,
    indice_avaliacao,
    data_ultimo_lote,
    timestamp: Date.now(),
  });
}

// Obter índice de funcionário do cache
export async function getIndiceFuncionario(cpf: string) {
  const database = await getDB();
  return await database.get("funcionarios-cache", cpf);
}

// Verificar se está online
export function isOnline(): boolean {
  return navigator.onLine;
}

// Sincronizar índices de funcionários
export async function syncIndicesFuncionarios() {
  if (!isOnline()) return;

  try {
    const response = await fetch("/api/avaliacao/indices");
    if (response.ok) {
      const { indices } = await response.json();

      const database = await getDB();

      for (const func of indices) {
        await database.put("funcionarios-cache", {
          cpf: func.cpf,
          nome: func.nome,
          indice_avaliacao: func.indice_avaliacao,
          data_ultimo_lote: func.data_ultimo_lote,
          timestamp: Date.now(),
        });
      }

      console.log("✅ Índices de funcionários sincronizados:", indices.length);
    }
  } catch (error) {
    console.error("❌ Erro ao sincronizar índices:", error);
  }
}

// Registrar Service Worker
export function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("✅ Service Worker registrado:", registration.scope);
        })
        .catch((error) => {
          console.error("❌ Erro ao registrar Service Worker:", error);
        });
    });
  }
}

// Sincronizar dados quando voltar online
export function setupOnlineSync() {
  window.addEventListener("online", () => {
    void (async () => {
      console.log("✅ Voltou online - Sincronizando dados...");

      try {
        const pendentes = await getAvaliacoesPendentes();

        for (const avaliacao of pendentes) {
          try {
            // Verificar se avaliação já foi sincronizada (evitar duplicatas)
            const checkResponse = await fetch("/api/avaliacao/check-sync", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                grupo: avaliacao.grupo,
                timestamp: avaliacao.timestamp,
              }),
            });

            if (checkResponse.ok) {
              const { alreadySynced } = await checkResponse.json();
              if (alreadySynced) {
                console.log(
                  "ℹ️ Avaliação já sincronizada, removendo do cache:",
                  avaliacao.id
                );
                if (avaliacao.id) await limparAvaliacaoPendente(avaliacao.id);
                continue;
              }
            }

            const response = await fetch("/api/avaliacao/save", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(avaliacao),
            });

            if (response.ok && avaliacao.id) {
              await limparAvaliacaoPendente(avaliacao.id);
              console.log("✅ Avaliação sincronizada:", avaliacao.id);
            } else {
              console.error(
                "❌ Falha na sincronização:",
                response.status,
                await response.text()
              );
            }
          } catch (syncError) {
            console.error("❌ Erro ao sincronizar avaliação:", syncError);
            // Não remover do cache em caso de erro - tentar novamente depois
          }
        }

        // Limpar cache expirado após sincronização
        await limparCacheExpirado();
      } catch (error) {
        console.error("❌ Erro geral na sincronização:", error);
      }
    })();
  });

  // Também tentar sincronizar periodicamente se estiver online
  setInterval(() => {
    void (async () => {
      if (isOnline()) {
        const pendentes = await getAvaliacoesPendentes();
        if (pendentes.length > 0) {
          console.log(
            "🔄 Sincronização periódica - pendentes:",
            pendentes.length
          );
          // Trigger manual do evento online
          window.dispatchEvent(new Event("online"));
        }
      }
    })();
  }, 30000); // A cada 30 segundos
}
