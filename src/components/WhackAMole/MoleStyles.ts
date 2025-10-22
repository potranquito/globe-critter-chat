import styled from 'styled-components';

export const MoleContainer = styled.div`
  height: 120px;
  justify-content: center;
  position: relative;
  width: 100%;

  &::after {
    background: url(/images/whackamole/mole-hidden.png) center bottom / contain no-repeat;
    bottom: -30px;
    content: "";
    height: 100px;
    justify-content: center;
    position: absolute;
    width: 100%;
    z-index: 2;
  }

  > div {
    overflow: hidden;
    position: relative;
    width: 100%;
    height: 100%;
  }

  @media (min-width: 1400px) {
    height: 200px;
    width: 180px;

    &::after {
      height: 150px;
      bottom: -40px;
    }
  }
`;

export const MoleItem = styled.div`
  background: url(/images/whackamole/mole-visible.png) center / contain no-repeat;
  bottom: -6px;
  height: 100px;
  position: absolute;
  width: 100px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1;
  cursor: url(/images/whackamole/hammer.png) 33 104, auto;

  @media (min-width: 1400px) {
    background-position: center;
    bottom: 20px;
    height: 150px;
    width: 200px;
    cursor: url(/images/whackamole/hammer.png) 33 104, auto;
  }
`;
