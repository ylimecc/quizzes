// Espera a que todo el HTML esté cargado antes de ejecutar el código
document.addEventListener('DOMContentLoaded', () => {

    // --- VARIABLES GLOBALES ---
    let todasLasPreguntas = []; // Aquí guardaremos todas las preguntas del archivo JSON
    let quizActual = []; // Las preguntas seleccionadas para el quiz en curso
    let preguntaActualIndex = 0;
    let puntaje = 0;
    let puntajesPorCategoria = {};

    // --- ELEMENTOS DEL DOM ---
    const setupScreen = document.getElementById('setup-screen');
    const quizScreen = document.getElementById('quiz-screen');
    const resultsScreen = document.getElementById('results-screen');
    const categoryCheckboxesContainer = document.getElementById('category-checkboxes');
    const numQuestionsInput = document.getElementById('num-questions');
    const startQuizBtn = document.getElementById('start-quiz-btn');
    const questionText = document.getElementById('question-text');
    const answerButtonsContainer = document.getElementById('answer-buttons');
    const progressText = document.getElementById('progress-text');
    const finalScoreText = document.getElementById('final-score');
    const categoryResultsContainer = document.getElementById('category-results');
    const restartBtn = document.getElementById('restart-btn');

    // --- LÓGICA PRINCIPAL ---

    // 1. Cargar las preguntas desde el archivo JSON
    fetch('preguntas.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok ' + response.statusText);
            }
            return response.json();
        })
        .then(data => {
            todasLasPreguntas = data;
            mostrarCategorias();
        })
        .catch(error => console.error('Error al cargar las preguntas:', error));

    // 2. Mostrar las categorías disponibles en la pantalla de inicio
    function mostrarCategorias() {
        const categorias = [...new Set(todasLasPreguntas.flatMap(p => p.categorias))];
        
        categoryCheckboxesContainer.innerHTML = '';
        categorias.forEach(categoria => {
            const div = document.createElement('div');
            div.innerHTML = `
                <input type="checkbox" id="${categoria}" name="categoria" value="${categoria}">
                <label for="${categoria}">${categoria}</label>
            `;
            categoryCheckboxesContainer.appendChild(div);
        });
    }

    // 3. Iniciar el quiz cuando el usuario hace clic en el botón
    startQuizBtn.addEventListener('click', () => {
        const categoriasSeleccionadas = [...document.querySelectorAll('input[name="categoria"]:checked')].map(el => el.value);
        const numPreguntas = parseInt(numQuestionsInput.value);

        if (categoriasSeleccionadas.length === 0) {
            alert('Por favor, selecciona al menos una categoría.');
            return;
        }

        let preguntasFiltradas = todasLasPreguntas.filter(p => 
            p.categorias.some(cat => categoriasSeleccionadas.includes(cat))
        );

        quizActual = preguntasFiltradas.sort(() => 0.5 - Math.random()).slice(0, numPreguntas);

        if (quizActual.length === 0) {
            alert('No hay preguntas disponibles para las categorías seleccionadas.');
            return;
        }
        
        empezarQuiz();
    });

    function empezarQuiz() {
        preguntaActualIndex = 0;
        puntaje = 0;
        puntajesPorCategoria = {};
        setupScreen.style.display = 'none';
        resultsScreen.style.display = 'none';
        quizScreen.style.display = 'block';
        mostrarSiguientePregunta();
    }
    
    // 4. Mostrar la pregunta actual y sus opciones
    function mostrarSiguientePregunta() {
        resetearEstado();
        const pregunta = quizActual[preguntaActualIndex];
        questionText.innerText = pregunta.pregunta;
        progressText.innerText = `Pregunta ${preguntaActualIndex + 1} de ${quizActual.length}`;
        
        pregunta.opciones.forEach(opcion => {
            const button = document.createElement('button');
            button.innerText = opcion.texto;
            button.classList.add('btn');
            button.dataset.correcta = opcion.esCorrecta;
            button.addEventListener('click', seleccionarRespuesta);
            answerButtonsContainer.appendChild(button);
        });
    }
    
    function resetearEstado() {
        answerButtonsContainer.innerHTML = '';
    }

    // 5. Manejar la selección de una respuesta
    function seleccionarRespuesta(e) {
        const botonSeleccionado = e.target;
        const esCorrecta = botonSeleccionado.dataset.correcta === 'true';
        const preguntaActual = quizActual[preguntaActualIndex];
        
        if (esCorrecta) {
            puntaje += preguntaActual.puntos;
        }
        
        preguntaActual.categorias.forEach(cat => {
            if (!puntajesPorCategoria[cat]) {
                puntajesPorCategoria[cat] = { correctas: 0, total: 0, puntos: 0, maxPuntos: 0 };
            }
            puntajesPorCategoria[cat].total++;
            puntajesPorCategoria[cat].maxPuntos += preguntaActual.puntos;
            if (esCorrecta) {
                puntajesPorCategoria[cat].correctas++;
                puntajesPorCategoria[cat].puntos += preguntaActual.puntos;
            }
        });

        Array.from(answerButtonsContainer.children).forEach(button => {
            button.disabled = true;
            if (button.dataset.correcta === 'true') {
                button.classList.add('correct');
            } else {
                button.classList.add('incorrect');
            }
        });

        setTimeout(() => {
            preguntaActualIndex++;
            if (preguntaActualIndex < quizActual.length) {
                mostrarSiguientePregunta();
            } else {
                mostrarResultados();
            }
        }, 1200);
    }
    
    // 6. Mostrar los resultados finales
    function mostrarResultados() {
        quizScreen.style.display = 'none';
        resultsScreen.style.display = 'block';

        const maxPuntos = quizActual.reduce((sum, p) => sum + p.puntos, 0);
        finalScoreText.innerText = `Tu puntaje final es: ${puntaje} de ${maxPuntos} puntos.`;
        
        categoryResultsContainer.innerHTML = '<h3>Desglose por Categoría:</h3>';
        for (const categoria in puntajesPorCategoria) {
            const res = puntajesPorCategoria[categoria];
            const div = document.createElement('div');
            div.classList.add('category-score');
            div.innerHTML = `
                <span>${categoria}</span>
                <span>${res.correctas} / ${res.total} (${res.puntos} de ${res.maxPuntos} pts)</span>
            `;
            categoryResultsContainer.appendChild(div);
        }
    }
    
    // 7. Reiniciar para crear un nuevo quiz
    restartBtn.addEventListener('click', () => {
        resultsScreen.style.display = 'none';
        setupScreen.style.display = 'block';
    });

});
