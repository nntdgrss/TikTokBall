import "./styles.css";
import "./game";

document.querySelector("#app").innerHTML = `
   <div class="canvas-container">
      <canvas id="gameCanvas"></canvas>
    </div>
    <button id="resetButton" style="display: none">Играть снова</button>
    <button id="settingsButton">Настройки</button>

    <div id="settingsModal" class="modal">
      <div class="modal-content">
        <div class="settings-header">
          <h2>Настройки игры</h2>
          <div class="lang-modal" id="langModal">
  <div class="lang-modal-content">
    <h3 data-translate="language">Выберите язык</h3>
    <div class="flags-container">
      <button class="lang-option">
        <img src="/usa_icon.png" alt="English" class="flag-icon">
      </button>
    </div>
  </div>
</div>
        </div>
        <div class="settings-grid">

        <div class="settings-section ball-settings">
          <h3>Настройки шарика</h3>
          <div class="settings-group">
            <div class="setting-item">
              <label for="ballSize">Размер шарика:</label>
              <input type="range" id="ballSize" min="5" max="20" value="10" />
              <div class="setting-value" id="ballSizeValue">10</div>
            </div>

            <div class="setting-item">
              <label for="ballSpeed">Скорость шарика:</label>
              <input type="range" id="ballSpeed" min="1" max="15" value="8" />
              <div class="setting-value" id="ballSpeedValue">8</div>
            </div>

            <div class="setting-item">
              <label for="ballGlow">Свечение шарика:</label>
              <input type="range" id="ballGlow" min="0" max="20" value="0" />
              <div class="setting-value" id="ballGlowValue">0</div>
            </div>

            <div class="setting-item">
              <label for="ballColor">Цвет шарика:</label>
              <input type="color" id="ballColor" value="#ffffff" />
            </div>

            <div class="setting-item">
              <label>
                <input type="checkbox" id="ballGradient" />
                Градиентная заливка
              </label>
            </div>

            <div class="setting-item">
              <label>
                <input type="checkbox" id="ballTrail" checked />
                След за шариком
              </label>
            </div>
          </div>
        </div>

        <div class="settings-section ring-settings">
          <h3>Настройки колец</h3>
          <div class="settings-group">
            <div class="setting-item">
              <label for="ringCount">Количество колец:</label>
              <input type="range" id="ringCount" min="1" max="20" value="5" />
              <div class="setting-value" id="ringCountValue">5</div>
            </div>

            <div class="setting-item">
              <label for="ringSpeed">Скорость вращения:</label>
              <input type="range" id="ringSpeed" min="1" max="50" value="10" />
              <div class="setting-value" id="ringSpeedValue">10</div>
            </div>

            <div class="setting-item">
              <label for="gapSize">Размер проема:</label>
              <input type="range" id="gapSize" min="15" max="180" value="45" />
              <div class="setting-value" id="gapSizeValue">45°</div>
            </div>

            <div class="setting-item">
              <label for="ringGlow">Свечение колец:</label>
              <input type="range" id="ringGlow" min="0" max="20" value="0" />
              <div class="setting-value" id="ringGlowValue">0</div>
            </div>

            <div class="setting-item">
              <label for="ringColor">Цвет колец:</label>
              <input type="color" id="ringColor" value="#ffffff" />
            </div>

            <div class="setting-item">
              <label>
                <input type="checkbox" id="ringGradient" />
                Градиентная заливка
              </label>
            </div>

            <div class="setting-item">
              <label>
                <input type="checkbox" id="randomRingColors" />
                Случайные цвета
              </label>
            </div>

            <div class="setting-item">
              <label>
                <input type="checkbox" id="synchronizedMovement" />
                Синхронное движение
              </label>
            </div>

            <div class="setting-item">
              <label>
                <input type="checkbox" id="ringPulse" checked />
                Пульсация колец
              </label>
            </div>

            <div class="setting-item">
              <label for="particleColor">Цвет частиц:</label>
              <input type="color" id="particleColor" value="#ffffff" />
            </div>

            <div class="setting-item">
              <label>
                <input type="checkbox" id="finalExplosionColors" checked />
                Разноцветный финальный взрыв
              </label>
            </div>

            <div class="setting-item">
              <label for="sparkColor">Цвет искр:</label>
              <select id="sparkColor">
                <option value="same">Как у кольца</option>
                <option value="contrast">Контрастный</option>
                <option value="random">Случайный</option>
              </select>
            </div>

            <div class="setting-item">
              <label for="pulseSpeed">Скорость пульсации:</label>
              <input type="range" id="pulseSpeed" min="1" max="10" value="5" />
              <div class="setting-value" id="pulseSpeedValue">5</div>
            </div>

            <div class="setting-item">
              <label for="pulseSize">Размер пульсации:</label>
              <input type="range" id="pulseSize" min="1" max="20" value="10" />
              <div class="setting-value" id="pulseSizeValue">10</div>
            </div>
          </div>
        </div>

        <div class="settings-section game-settings">
          <h3>Игровые настройки</h3>
          <div class="settings-group">
            <div class="setting-item">
              <label>
                <input type="checkbox" id="infiniteMode" />
                Бесконечная игра
              </label>
            </div>
          </div>
        </div>

        <div class="button-group">
          <button id="closeSettings">Отмена</button>
          <button id="saveSettings">Сохранить</button>
        </div>
      </div>
    </div>
`;
