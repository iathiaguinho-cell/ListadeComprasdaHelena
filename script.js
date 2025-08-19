document.addEventListener('DOMContentLoaded', () => {
    const itemInput = document.getElementById('item-input');
    const addBtn = document.getElementById('add-btn');
    const listaAComprar = document.getElementById('lista-a-comprar');
    const listaComprados = document.getElementById('lista-comprados');

    // Carregar itens do localStorage
    function carregarItens() {
        const itens = JSON.parse(localStorage.getItem('listaDeCompras')) || [];
        itens.forEach(item => criarItemNaLista(item.texto, item.comprado));
    }

    // Salvar itens no localStorage
    function salvarItens() {
        const itens = [];
        document.querySelectorAll('#lista-a-comprar li, #lista-comprados li').forEach(li => {
            itens.push({
                texto: li.firstChild.textContent.trim(),
                comprado: li.classList.contains('comprado')
            });
        });
        localStorage.setItem('listaDeCompras', JSON.stringify(itens));
    }

    // Criar item na lista
    function criarItemNaLista(texto, comprado = false) {
        const li = document.createElement('li');
        li.textContent = texto;

        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'item-actions';

        const comprarBtn = document.createElement('button');
        comprarBtn.innerHTML = '<i class="fas fa-check"></i>';
        comprarBtn.className = 'comprar-btn';
        comprarBtn.title = 'Marcar como comprado';
        comprarBtn.addEventListener('click', () => {
            li.classList.toggle('comprado');
            if (li.classList.contains('comprado')) {
                listaComprados.appendChild(li);
                comprarBtn.innerHTML = '<i class="fas fa-undo"></i>';
                comprarBtn.title = 'Marcar como "a comprar"';
            } else {
                listaAComprar.appendChild(li);
                comprarBtn.innerHTML = '<i class="fas fa-check"></i>';
                comprarBtn.title = 'Marcar como comprado';
            }
            salvarItens();
        });

        const excluirBtn = document.createElement('button');
        excluirBtn.innerHTML = '<i class="fas fa-trash"></i>';
        excluirBtn.className = 'excluir-btn';
        excluirBtn.title = 'Excluir item';
        excluirBtn.addEventListener('click', () => {
            li.remove();
            salvarItens();
        });

        actionsDiv.appendChild(comprarBtn);
        actionsDiv.appendChild(excluirBtn);
        li.appendChild(actionsDiv);

        if (comprado) {
            li.classList.add('comprado');
            listaComprados.appendChild(li);
            comprarBtn.innerHTML = '<i class="fas fa-undo"></i>';
            comprarBtn.title = 'Marcar como "a comprar"';
        } else {
            listaAComprar.appendChild(li);
        }
    }

    // Adicionar item
    addBtn.addEventListener('click', () => {
        const textoItem = itemInput.value.trim();
        if (textoItem) {
            criarItemNaLista(textoItem);
            salvarItens();
            itemInput.value = '';
            itemInput.focus();
        }
    });

    itemInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addBtn.click();
        }
    });

    carregarItens();

    // --- INÍCIO DO CÓDIGO DA IA DE OTIMIZAÇÃO DE COMPRAS --- 

    // !!! IMPORTANTE: COLOQUE SUA CHAVE DE API AQUI DENTRO DAS ASPAS !!!
    const API_KEY = "AIzaSyDq_1SBvqcI0_XIvN1FJm38MoTNz6Wvh3k"; 
    const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${API_KEY}`;

    const optimizeButton = document.getElementById('optimize-button');
    const modal = document.getElementById('ai-modal');
    const closeButton = document.querySelector('.close-button');
    const aiResultsContainer = document.getElementById('ai-results-container');

    function showModal() { modal.style.display = 'block'; }
    function hideModal() { modal.style.display = 'none'; }

    closeButton.addEventListener('click', hideModal);
    window.addEventListener('click', (event) => {
        if (event.target == modal) {
            hideModal();
        }
    });

    optimizeButton.addEventListener('click', async () => {
        if (API_KEY === "SUA_CHAVE_DE_API_AQUI" || API_KEY === "") {
            alert("Erro de configuração: A chave de API do Google AI não foi definida no arquivo script.js.");
            return;
        }

        const itemsToBuy = [];
        document.querySelectorAll('#lista-a-comprar li').forEach(li => {
            itemsToBuy.push(li.firstChild.textContent.trim());
        });

        if (itemsToBuy.length === 0) {
            alert("Sua lista 'A Comprar' está vazia. Adicione itens antes de otimizar!");
            return;
        }

        const userCEP = prompt("Para encontrar as melhores ofertas perto de você, por favor, digite seu CEP (ex: 01001-000):");
        if (!userCEP) {
            return; // Usuário cancelou
        }

        showModal();
        aiResultsContainer.innerHTML = '<p>Analisando sua lista e buscando os melhores preços...</p><div class="loading-spinner"></div>';

        const promptText = `
            Aja como um assistente de compras especialista para o Brasil.
            Analise a seguinte lista de compras: ${itemsToBuy.join(', ')}.
            Meu CEP é ${userCEP}.
            Sua tarefa é encontrar as 3 melhores opções de preço para cada item, priorizando supermercados e lojas online que entregam na minha região.
            Retorne o resultado em formato HTML simples. Use uma lista não ordenada (<ul>) para a lista geral. Cada item da lista (<li>) deve conter o nome do item em negrito (<b>), seguido por uma lista ordenada (<ol>) com as 3 melhores opções. Cada opção deve ter o nome da loja e o preço estimado. Se encontrar um link direto para o produto, adicione-o.
            Se não encontrar um item, informe claramente.
            Exemplo de formato de resposta:
            <li><b>Arroz 5kg</b><ol><li>Carrefour: R$ 25,90</li><li>Supermercado Dia: R$ 26,50</li><li>Atacadão Online: R$ 24,80</li></ol></li>
        `;

        try {
            const response = await fetch(GEMINI_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: promptText }] }],
                    generationConfig: {
                        response_mime_type: "text/html",
                    }
                })
            });

            if (!response.ok) {
                const errorBody = await response.json();
                throw new Error(`Erro na API: ${errorBody.error.message}`);
            }

            const data = await response.json();
            const aiResponse = data.candidates[0].content.parts[0].text;
            aiResultsContainer.innerHTML = aiResponse;

        } catch (error) {
            console.error("Erro ao chamar a IA:", error);
            aiResultsContainer.innerHTML = `<p><b>Desculpe, ocorreu um erro.</b></p><p>Não foi possível contatar o assistente de IA. Verifique se sua chave de API está correta e se sua conexão com a internet está funcionando.</p><p><small>Detalhe do erro: ${error.message}</small></p>`;
        }
    });
});

